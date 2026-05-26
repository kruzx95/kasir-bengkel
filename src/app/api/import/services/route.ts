import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

type ExcelRow = Record<string, unknown>

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
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak ada data' }, { status: 400 })
    }

    // Normalize header keys
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

      const name = String(row['nama'] || row['name'] || '').trim()
      if (!name) {
        errors.push(`Baris ${rowNum}: kolom "nama" wajib diisi`)
        continue
      }

      const price = parseFloat(
        String(row['harga'] || row['price'] || '0').replace(/[^0-9.]/g, '')
      )
      if (isNaN(price) || price <= 0) {
        errors.push(`Baris ${rowNum}: "harga" wajib diisi dan lebih dari 0`)
        continue
      }

      parsed.push({
        name,
        price,
        category: String(row['kategori'] || row['category'] || '').trim() || null,
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
