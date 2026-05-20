import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const branchMode = formData.get('branchMode') as string // 'all' | branchId

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext || '')) {
      return NextResponse.json({ error: 'Format file harus .xlsx atau .xls' }, { status: 400 })
    }

    // Parse Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak ada data' }, { status: 400 })
    }

    // Normalize header keys (lowercase, trim)
    const normalized = rows.map((row) => {
      const obj: Record<string, any> = {}
      for (const key of Object.keys(row)) {
        obj[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key]
      }
      return obj
    })

    // Validate & parse rows
    const errors: string[] = []
    const parsed: {
      name: string
      sku: string | null
      sparepartType: string | null
      sparepartBrand: string | null
      sparepartSize: string | null
      buyPrice: number
      sellPrice: number
      stock: number
      unit: string
    }[] = []

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]
      const rowNum = i + 2 // Excel row number (1=header, 2=first data)

      const name = String(row['nama'] || row['name'] || '').trim()
      if (!name) {
        errors.push(`Baris ${rowNum}: kolom "nama" wajib diisi`)
        continue
      }

      const buyPrice = parseFloat(String(row['harga_beli'] || row['buy_price'] || '0').replace(/[^0-9.]/g, ''))
      const sellPrice = parseFloat(String(row['harga_jual'] || row['sell_price'] || '0').replace(/[^0-9.]/g, ''))
      const stock = parseInt(String(row['stok'] || row['stock'] || '0').replace(/[^0-9]/g, ''), 10)

      if (isNaN(buyPrice) || buyPrice < 0) {
        errors.push(`Baris ${rowNum}: harga_beli tidak valid`)
        continue
      }
      if (isNaN(sellPrice) || sellPrice <= 0) {
        errors.push(`Baris ${rowNum}: harga_jual wajib diisi dan lebih dari 0`)
        continue
      }

      parsed.push({
        name,
        sku: String(row['sku'] || '').trim() || null,
        sparepartType: String(row['jenis'] || row['sparepart_type'] || '').trim() || null,
        sparepartBrand: String(row['merk'] || row['brand'] || '').trim() || null,
        sparepartSize: String(row['ukuran'] || row['size'] || '').trim() || null,
        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
        sellPrice,
        stock: isNaN(stock) ? 0 : stock,
        unit: String(row['satuan'] || row['unit'] || 'pcs').trim() || 'pcs',
      })
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Terdapat kesalahan data', details: errors }, { status: 422 })
    }

    // Determine target branches
    let branches: { id: string }[]
    if (branchMode === 'all') {
      branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } })
    } else {
      const branch = await prisma.branch.findUnique({ where: { id: branchMode }, select: { id: true } })
      if (!branch) return NextResponse.json({ error: 'Cabang tidak ditemukan' }, { status: 400 })
      branches = [branch]
    }

    // Bulk upsert — update jika nama+cabang sudah ada, insert jika belum
    let inserted = 0
    let updated = 0

    for (const branch of branches) {
      for (const sp of parsed) {
        const existing = await prisma.sparepart.findFirst({
          where: {
            branchId: branch.id,
            name: sp.name,
            isActive: true,
          },
          select: { id: true },
        })

        if (existing) {
          await prisma.sparepart.update({
            where: { id: existing.id },
            data: {
              sku: sp.sku,
              sparepartType: sp.sparepartType,
              sparepartBrand: sp.sparepartBrand,
              sparepartSize: sp.sparepartSize,
              buyPrice: sp.buyPrice,
              sellPrice: sp.sellPrice,
              stock: sp.stock,
              unit: sp.unit,
            },
          })
          updated++
        } else {
          await prisma.sparepart.create({
            data: { ...sp, branchId: branch.id },
          })
          inserted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Selesai: ${inserted} sparepart baru ditambahkan, ${updated} sparepart diperbarui (${branches.length} cabang)`,
      inserted,
      updated,
      branches: branches.length,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengimpor file' }, { status: 500 })
  }
}
