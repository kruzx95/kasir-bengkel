import { NextRequest, NextResponse } from 'next/server'
import { getSession, isDemoUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
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
        { error: 'Mode Demo (Read-Only): Import stok gudang dinonaktifkan demi keamanan.' },
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
    const nameKeywords = ['nama', 'name', 'nama_barang', 'nama_sparepart', 'sparepart', 'item', 'deskripsi']
    const warehouseKeywords = [
      'stok_gudang',
      'warehouse_stock',
      'stok',
      'stock',
      'qty_gudang',
      'jumlah_gudang',
      'gudang',
    ]

    for (let r = 0; r < Math.min(matrix.length, 25); r++) {
      const rowCells = (matrix[r] || []).map((cell) =>
        String(cell || '').replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, '_')
      )
      const hasName = rowCells.some((c) => nameKeywords.includes(c))
      const hasStockOrWarehouse = rowCells.some((c) => warehouseKeywords.includes(c))

      if (hasName && hasStockOrWarehouse) {
        headerRowIndex = r
        break
      }
    }

    // Fallback search if only name is found
    if (headerRowIndex === -1) {
      for (let r = 0; r < Math.min(matrix.length, 25); r++) {
        const rowCells = (matrix[r] || []).map((cell) =>
          String(cell || '').replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, '_')
        )
        if (rowCells.some((c) => nameKeywords.includes(c))) {
          headerRowIndex = r
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        {
          error:
            'Kolom header tidak ditemukan. Pastikan file Excel memiliki kolom "nama" dan "stok_gudang" (atau gunakan template Excel yang tersedia).',
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
        rowText.includes('nama lengkap') ||
        rowText.includes('petunjuk:') ||
        rowText.includes('hapus baris contoh')
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
      warehouseStock: number
      minWarehouseStock: number
      unit: string
    }[] = []

    for (let i = 0; i < normalized.length; i++) {
      const row = normalized[i]
      const rowNum = headerRowIndex + 2 + i

      const name = String(
        row['nama'] ||
          row['name'] ||
          row['nama_barang'] ||
          row['nama_sparepart'] ||
          row['sparepart'] ||
          row['item'] ||
          row['deskripsi'] ||
          ''
      ).trim()

      const warehouseStockRaw =
        row['stok_gudang'] ??
        row['warehouse_stock'] ??
        row['stok'] ??
        row['stock'] ??
        row['qty_gudang'] ??
        row['jumlah_gudang'] ??
        row['gudang']

      const minWarehouseStockRaw =
        row['min_stok_gudang'] ??
        row['min_warehouse_stock'] ??
        row['min_stok'] ??
        row['min_stock'] ??
        row['min_gudang']

      const buyPriceRaw =
        row['harga_beli'] ?? row['buy_price'] ?? row['harga_modal'] ?? row['harga_pokok'] ?? row['modal']
      const sellPriceRaw =
        row['harga_jual'] ??
        row['sell_price'] ??
        row['harga'] ??
        row['price'] ??
        row['harga_eceran'] ??
        row['harga_konsumen']

      // Skip empty rows
      if (!name && warehouseStockRaw === undefined && !buyPriceRaw && !sellPriceRaw) {
        continue
      }

      if (!name) {
        errors.push(`Baris ${rowNum}: kolom "nama" wajib diisi`)
        continue
      }

      const warehouseStock = parseInt(String(warehouseStockRaw ?? '0').replace(/[^0-9-]/g, ''), 10)
      const minWarehouseStock = parseInt(String(minWarehouseStockRaw ?? '0').replace(/[^0-9-]/g, ''), 10)
      const buyPrice = parsePrice(buyPriceRaw)
      const sellPrice = parsePrice(sellPriceRaw)

      parsed.push({
        name,
        sku: String(row['sku'] || row['barcode'] || row['kode'] || '').trim() || null,
        sparepartType: String(row['jenis'] || row['sparepart_type'] || row['kategori'] || '').trim() || null,
        sparepartBrand: String(row['merk'] || row['brand'] || row['merek'] || '').trim() || null,
        sparepartSize: String(row['ukuran'] || row['size'] || '').trim() || null,
        etalase: String(row['lokasi_rak'] || row['rak_gudang'] || row['etalase'] || row['rak'] || row['shelf'] || row['lokasi'] || '').trim() || null,
        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
        sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
        warehouseStock: isNaN(warehouseStock) ? 0 : Math.max(0, warehouseStock),
        minWarehouseStock: isNaN(minWarehouseStock) ? 0 : Math.max(0, minWarehouseStock),
        unit: String(row['satuan'] || row['unit'] || 'pcs').trim() || 'pcs',
      })
    }

    if (parsed.length === 0 && errors.length === 0) {
      return NextResponse.json(
        {
          error:
            'Tidak ada data valid yang dapat diimpor. Pastikan data stok gudang telah diisi di bawah baris header.',
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

    const importLabel = `[IMPORT WAREHOUSE] ${parsed.length} item, ${branches.length} cabang`
    console.time(importLabel)
    let inserted = 0
    let updated = 0

    for (const branch of branches) {
      // 1. Fetch existing spareparts in branch
      const existingSpareparts = await prisma.sparepart.findMany({
        where: { branchId: branch.id, isActive: true },
        select: { id: true, name: true, sku: true, buyPrice: true, sellPrice: true },
      })

      const existingByName = new Map(existingSpareparts.map((s) => [s.name.toLowerCase().trim(), s]))
      const existingBySku = new Map(
        existingSpareparts.filter((s) => !!s.sku).map((s) => [s.sku!.toLowerCase().trim(), s])
      )

      const toCreate: typeof parsed = []
      const toUpdate: { id: string; data: (typeof parsed)[0] }[] = []

      for (const item of parsed) {
        const match = (item.sku ? existingBySku.get(item.sku.toLowerCase().trim()) : null) ||
                      existingByName.get(item.name.toLowerCase().trim())

        if (match) {
          toUpdate.push({ id: match.id, data: item })
        } else {
          toCreate.push(item)
        }
      }

      // 2. Batch insert new items with stock=0, warehouseStock=item.warehouseStock
      if (toCreate.length > 0) {
        await prisma.sparepart.createMany({
          data: toCreate.map((sp) => ({
            branchId: branch.id,
            name: sp.name,
            sku: sp.sku,
            sparepartType: sp.sparepartType,
            sparepartBrand: sp.sparepartBrand,
            sparepartSize: sp.sparepartSize,
            etalase: sp.etalase,
            buyPrice: sp.buyPrice,
            sellPrice: sp.sellPrice > 0 ? sp.sellPrice : sp.buyPrice,
            stock: 0,
            warehouseStock: sp.warehouseStock,
            minWarehouseStock: sp.minWarehouseStock,
            unit: sp.unit,
            isActive: true,
          })),
          skipDuplicates: true,
        })
        inserted += toCreate.length
      }

      // 3. Update existing items: Update warehouseStock and metadata WITHOUT touching shop stock
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(({ id, data }) => {
            const updatePayload: Record<string, unknown> = {
              warehouseStock: data.warehouseStock,
            }
            if (data.minWarehouseStock > 0) updatePayload.minWarehouseStock = data.minWarehouseStock
            if (data.etalase) updatePayload.etalase = data.etalase
            if (data.sku) updatePayload.sku = data.sku
            if (data.sparepartType) updatePayload.sparepartType = data.sparepartType
            if (data.sparepartBrand) updatePayload.sparepartBrand = data.sparepartBrand
            if (data.sparepartSize) updatePayload.sparepartSize = data.sparepartSize
            if (data.buyPrice > 0) updatePayload.buyPrice = data.buyPrice
            if (data.sellPrice > 0) updatePayload.sellPrice = data.sellPrice
            if (data.unit) updatePayload.unit = data.unit

            return prisma.sparepart.update({
              where: { id },
              data: updatePayload,
            })
          })
        )
        updated += toUpdate.length
      }
    }

    console.timeEnd(importLabel)

    createActivityLog({
      action: 'IMPORT_WAREHOUSE_STOCK',
      category: 'STOCK',
      description: `Import Stok Gudang Excel: ${inserted} ditambahkan, ${updated} diperbarui (${branches.length} cabang)`,
      details: {
        fileName: file.name,
        inserted,
        updated,
        branchesCount: branches.length,
      },
      branchId: session.branchId || branches[0]?.id || null,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor stok gudang: ${inserted} item baru ditambahkan, ${updated} item diperbarui di ${branches.length} cabang.`,
      inserted,
      updated,
      total: parsed.length,
    })
  } catch (error) {
    console.error('Import warehouse stock error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses file Excel: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
