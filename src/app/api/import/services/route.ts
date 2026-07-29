import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

type ExcelRow = Record<string, unknown>

function parsePrice(value: unknown): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  if (!value) return 0

  let str = String(value).trim()
  // Remove currency prefix/suffix like "Rp", "RP", "rp", spaces
  str = str.replace(/rp/gi, '').trim()

  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Indonesian format 25.000,00 -> 25000.00
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // US format 25,000.00 -> 25000.00
      str = str.replace(/,/g, '')
    }
  } else if (str.includes('.')) {
    const parts = str.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '')
    }
  } else if (str.includes(',')) {
    const parts = str.split(',')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '')
    } else {
      str = str.replace(',', '.')
    }
  }

  const cleaned = str.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

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

    // Parse Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak ada data' }, { status: 400 })
    }

    // Normalize header keys (lowercase, trim, replace spaces with underscores)
    const normalized = rows.map((row) => {
      const obj: Record<string, unknown> = {}
      for (const key of Object.keys(row)) {
        obj[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key]
      }
      return obj
    })

    // Validate & parse rows
    const errors: string[] = []
    const parsed: { name: string; price: number; category: string | null }[] = []

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]
      const rowNum = i + 2

      const name = String(
        row['nama'] ||
          row['name'] ||
          row['nama_jasa'] ||
          row['nama_servis'] ||
          row['jasa'] ||
          row['servis'] ||
          row['service'] ||
          row['service_name'] ||
          ''
      ).trim()

      const priceRaw =
        row['harga'] ??
        row['price'] ??
        row['harga_jasa'] ??
        row['harga_servis'] ??
        row['tarif'] ??
        row['biaya'] ??
        row['rate']

      const category =
        String(row['kategori'] || row['category'] || row['kelompok'] || row['jenis'] || '').trim() || null

      // Skip completely empty rows
      if (!name && (!priceRaw || priceRaw === '') && !category) {
        continue
      }

      if (!name) {
        errors.push(`Baris ${rowNum}: kolom "nama" wajib diisi`)
        continue
      }

      const price = parsePrice(priceRaw)
      if (price <= 0) {
        errors.push(`Baris ${rowNum}: "harga" wajib diisi dan lebih dari 0`)
        continue
      }

      parsed.push({
        name,
        price,
        category,
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

    // Upsert — update jika nama+cabang sudah ada, insert jika belum
    let inserted = 0
    let updated = 0

    for (const branch of branches) {
      for (const svc of parsed) {
        const existing = await prisma.service.findFirst({
          where: { branchId: branch.id, name: svc.name, isActive: true },
          select: { id: true },
        })

        if (existing) {
          await prisma.service.update({
            where: { id: existing.id },
            data: { price: svc.price, category: svc.category },
          })
          updated++
        } else {
          await prisma.service.create({
            data: { ...svc, branchId: branch.id },
          })
          inserted++
        }
      }
    }

    revalidatePath('/admin/master/services')
    revalidatePath('/kasir/jasa-servis')

    return NextResponse.json({
      success: true,
      message: `Selesai: ${inserted} jasa baru ditambahkan, ${updated} jasa diperbarui (${branches.length} cabang)`,
      inserted,
      updated,
      branches: branches.length,
    })
  } catch (error: unknown) {
    console.error('Import service error:', error)
    const message = error instanceof Error ? error.message : 'Gagal mengimpor file'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
