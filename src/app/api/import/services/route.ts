import { NextRequest, NextResponse } from 'next/server'
import { getSession, isDemoUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import { createActivityLog } from '@/lib/logger'
import { parsePrice } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'KASIR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDemoUser(session)) {
      return NextResponse.json(
        { error: 'Mode Demo (Read-Only): Import jasa servis dinonaktifkan demi keamanan.' },
        { status: 403 }
      )
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
    if (!sheetName || !workbook.Sheets[sheetName]) {
      return NextResponse.json({ error: 'File Excel tidak memiliki lembar kerja (worksheet)' }, { status: 400 })
    }
    const sheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

    if (!matrix || matrix.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak ada data' }, { status: 400 })
    }

    // Find header row dynamically
    let headerRowIndex = -1
    const nameKeywords = [
      'nama',
      'name',
      'nama_jasa',
      'nama_servis',
      'nama_layanan',
      'jasa',
      'servis',
      'service',
      'service_name',
      'layanan',
      'pekerjaan',
      'uraian',
      'uraian_pekerjaan',
      'deskripsi',
      'item',
      'nama_barang',
    ]
    const priceKeywords = [
      'harga',
      'price',
      'harga_jasa',
      'harga_servis',
      'tarif',
      'biaya',
      'rate',
      'harga_jual',
      'sell_price',
      'ongkos',
      'ongkos_kerja',
      'upah',
      'fee',
      'nominal',
      'biaya_jasa',
    ]

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
      // Check if file seems to be a sparepart template/file
      const allText = matrix
        .slice(0, 15)
        .map((row) => (row || []).map((c) => String(c || '').toLowerCase()).join(' '))
        .join(' ')

      if (
        allText.includes('template import sparepart') ||
        allText.includes('harga_beli') ||
        allText.includes('sku') ||
        allText.includes('etalase')
      ) {
        return NextResponse.json(
          {
            error:
              'File yang diunggah tampaknya adalah template/data Sparepart. Silakan unduh dan gunakan template Jasa Servis yang tersedia.',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error:
            'Kolom header tidak ditemukan. Pastikan file Excel memiliki kolom "nama" dan "harga" (atau unduh template Excel yang tersedia).',
        },
        { status: 400 }
      )
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
        rowText.includes('nama jasa /') ||
        rowText.includes('nama lengkap') ||
        rowText.includes('petunjuk:') ||
        rowText.includes('hapus baris contoh') ||
        rowText.includes('contoh: oli')
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
    const parsed: { name: string; price: number; category: string | null }[] = []

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]
      const rowNum = headerRowIndex + 2 + i

      const name = String(
        row['nama'] ||
          row['name'] ||
          row['nama_jasa'] ||
          row['nama_servis'] ||
          row['nama_layanan'] ||
          row['jasa'] ||
          row['servis'] ||
          row['service'] ||
          row['service_name'] ||
          row['layanan'] ||
          row['pekerjaan'] ||
          row['uraian'] ||
          row['uraian_pekerjaan'] ||
          row['deskripsi'] ||
          row['item'] ||
          row['nama_barang'] ||
          ''
      ).trim()

      const priceRaw =
        row['harga'] ??
        row['harga_jasa'] ??
        row['harga_servis'] ??
        row['tarif'] ??
        row['biaya'] ??
        row['ongkos'] ??
        row['ongkos_kerja'] ??
        row['harga_jual'] ??
        row['price'] ??
        row['sell_price'] ??
        row['rate'] ??
        row['fee'] ??
        row['nominal'] ??
        row['biaya_jasa']

      const category =
        String(
          row['kategori'] ||
            row['category'] ||
            row['kelompok'] ||
            row['jenis'] ||
            row['group'] ||
            row['tipe'] ||
            row['type'] ||
            row['klasifikasi'] ||
            ''
        ).trim() || null

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
        errors.push(`Baris ${rowNum} (${name}): kolom "harga" wajib diisi dan lebih dari 0`)
        continue
      }

      parsed.push({
        name,
        price,
        category,
      })
    }

    if (parsed.length === 0 && errors.length === 0) {
      return NextResponse.json(
        {
          error:
            'Tidak ada data valid yang dapat diimpor. Pastikan data jasa servis telah diisi di bawah baris header.',
        },
        { status: 400 }
      )
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Terdapat kesalahan data pada file Excel', details: errors }, { status: 422 })
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

    // Deduplicate parsed rows by lowercase name (last occurrence wins)
    const uniqueMap = new Map<string, (typeof parsed)[0]>()
    for (const item of parsed) {
      uniqueMap.set(item.name.toLowerCase().trim(), item)
    }
    const deduplicatedParsed = Array.from(uniqueMap.values())

    // High-performance bulk upsert
    let inserted = 0
    let updated = 0

    for (const branch of branches) {
      const existingServices = await prisma.service.findMany({
        where: {
          branchId: branch.id,
          isActive: true,
          name: { in: deduplicatedParsed.map((s) => s.name) },
        },
        select: { id: true, name: true },
      })
      const existingMap = new Map(existingServices.map((s) => [s.name.toLowerCase(), s.id]))

      const toCreate = deduplicatedParsed.filter((s) => !existingMap.has(s.name.toLowerCase()))
      const toUpdate = deduplicatedParsed.filter((s) => existingMap.has(s.name.toLowerCase()))

      if (toCreate.length > 0) {
        await prisma.service.createMany({
          data: toCreate.map((s) => ({
            name: s.name,
            price: s.price,
            category: s.category,
            branchId: branch.id,
            isActive: true,
          })),
        })
        inserted += toCreate.length
      }

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((s) => {
            const id = existingMap.get(s.name.toLowerCase())
            if (!id) return Promise.resolve()
            return prisma.service.update({
              where: { id },
              data: {
                price: s.price,
                category: s.category,
              },
            })
          })
        )
        updated += toUpdate.length
      }
    }

    createActivityLog({
      action: 'IMPORT_SERVICES',
      category: 'MASTER',
      description: `Import Excel Jasa Servis: ${inserted} ditambahkan, ${updated} diperbarui (${branches.length} cabang)`,
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

