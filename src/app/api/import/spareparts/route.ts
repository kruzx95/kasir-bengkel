import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { createActivityLog } from '@/lib/logger'

type ExcelRow = Record<string, unknown>

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'KASIR')) {
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

    // Parse Excel to 2D matrix
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

    if (!matrix || matrix.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak ada data' }, { status: 400 })
    }

    // Find header row dynamically
    let headerRowIndex = -1
    const nameKeywords = ['nama', 'name', 'nama_barang', 'nama_sparepart', 'sparepart', 'item']
    const priceKeywords = ['harga_jual', 'sell_price', 'harga', 'price', 'harga_beli', 'buy_price']

    for (let r = 0; r < Math.min(matrix.length, 25); r++) {
      const rowCells = (matrix[r] || []).map((cell) =>
        String(cell || '').replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, '_')
      )
      const hasName = rowCells.some((c) => nameKeywords.includes(c))
      const hasPrice = rowCells.some((c) => priceKeywords.includes(c))

      if (hasName && hasPrice) {
        headerRowIndex = r
        break
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0
    }

    const rawHeaders = (matrix[headerRowIndex] || []).map((cell) =>
      String(cell || '').replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, '_')
    )

    // Convert matrix rows after header into objects
    const normalized: Record<string, unknown>[] = []
    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const rowArr = matrix[r] || []
      if (!rowArr.some((cell) => String(cell || '').trim() !== '')) continue

      // Skip template hint / note rows
      const rowText = rowArr.map((c) => String(c || '').toLowerCase()).join(' ')
      if (
        rowText.includes('angka saja') ||
        rowText.includes('wajib diisi') ||
        rowText.includes('opsional') ||
        rowText.includes('nama lengkap') ||
        rowText.includes('petunjuk:')
      ) {
        continue
      }

      const obj: Record<string, unknown> = {}
      rawHeaders.forEach((hKey, colIdx) => {
        if (hKey) {
          obj[hKey] = rowArr[colIdx] ?? ''
        }
      })
      normalized.push(obj)
    }

    // Validate & parse rows
    const errors: string[] = []
    const parsed: {
      name: string
      sku: string | null
      sparepartType: string | null
      sparepartBrand: string | null
      sparepartSize: string | null
      etalase: string | null
      buyPrice: number
      sellPrice: number
      stock: number
      unit: string
    }[] = []

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]
      const rowNum = headerRowIndex + 2 + i

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
        etalase: String(row['etalase'] || row['rak'] || row['shelf'] || '').trim() || null,
        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
        sellPrice,
        stock: isNaN(stock) ? 0 : stock,
        unit: String(row['satuan'] || row['unit'] || 'pcs').trim() || 'pcs',
      })
    }

    if (parsed.length === 0 && errors.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang dapat diimpor' }, { status: 400 })
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Terdapat kesalahan data', details: errors }, { status: 422 })
    }

    // Determine target branches
    let branches: { id: string }[]
    if (session.role === 'KASIR' || (session.role === 'ADMIN' && session.branchId)) {
      if (!session.branchId) return NextResponse.json({ error: 'Cabang user tidak ditemukan' }, { status: 400 })
      branches = [{ id: session.branchId }]
    } else if (branchMode === 'all') {
      branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } })
    } else {
      const branch = await prisma.branch.findUnique({ where: { id: branchMode }, select: { id: true } })
      if (!branch) return NextResponse.json({ error: 'Cabang tidak ditemukan' }, { status: 400 })
      branches = [branch]
    }

    // Optimized bulk upsert — batch strategy per branch
    // Sebelumnya: N+1 query (1 findFirst + 1 create/update per item) → sangat lambat
    // Sekarang: 1 findMany (fetch semua existing), lalu createMany + Promise.all update
    const importLabel = `[IMPORT] ${parsed.length} item, ${branches.length} cabang`
    console.time(importLabel)
    console.log(`[IMPORT] Mulai proses: ${parsed.length} item → ${branches.length} cabang`)
    let inserted = 0
    let updated = 0

    for (const branch of branches) {
      // Langkah 1: Ambil semua sparepart aktif di cabang ini sekaligus (1 query)
      const existingNames = new Set(
        (
          await prisma.sparepart.findMany({
            where: { branchId: branch.id, isActive: true },
            select: { id: true, name: true },
          })
        ).map((s) => s.name)
      )

      // Langkah 2: Ambil detail existing yang perlu di-update (id + name)
      const existingMap = new Map(
        (
          await prisma.sparepart.findMany({
            where: {
              branchId: branch.id,
              isActive: true,
              name: { in: parsed.map((sp) => sp.name) },
            },
            select: { id: true, name: true },
          })
        ).map((s) => [s.name, s.id])
      )

      // Langkah 3: Pisahkan data menjadi toCreate dan toUpdate
      const toCreate = parsed.filter((sp) => !existingNames.has(sp.name))
      const toUpdate = parsed.filter((sp) => existingNames.has(sp.name))

      // Langkah 4: Batch insert semua item baru sekaligus (1 query)
      if (toCreate.length > 0) {
        await prisma.sparepart.createMany({
          data: toCreate.map((sp) => ({ ...sp, branchId: branch.id })),
          skipDuplicates: true,
        })
        inserted += toCreate.length
      }

      // Langkah 5: Update semua item existing secara paralel (bukan sequential await)
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((sp) => {
            const id = existingMap.get(sp.name)
            if (!id) return Promise.resolve()
            return prisma.sparepart.update({
              where: { id },
              data: {
                sku: sp.sku,
                sparepartType: sp.sparepartType,
                sparepartBrand: sp.sparepartBrand,
                sparepartSize: sp.sparepartSize,
                etalase: sp.etalase,
                buyPrice: sp.buyPrice,
                sellPrice: sp.sellPrice,
                stock: sp.stock,
                unit: sp.unit,
              },
            })
          })
        )
        updated += toUpdate.length
      }
    }

    console.timeEnd(importLabel)
    console.log(`[IMPORT] Selesai: ${inserted} inserted, ${updated} updated`)

    createActivityLog({
      action: 'IMPORT_SPAREPARTS',
      category: 'MASTER',
      description: `Import Excel Sparepart: ${inserted} ditambahkan, ${updated} diperbarui (${branches.length} cabang)`,
      details: {
        fileName: file.name,
        inserted,
        updated,
        branchesCount: branches.length,
      },
      branchId: session.branchId || null,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    return NextResponse.json({
      success: true,
      message: `Selesai: ${inserted} sparepart baru ditambahkan, ${updated} sparepart diperbarui (${branches.length} cabang)`,
      inserted,
      updated,
      branches: branches.length,
    })
  } catch (error: unknown) {
    console.error('Import error:', error)
    const message = error instanceof Error ? error.message : 'Gagal mengimpor file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
