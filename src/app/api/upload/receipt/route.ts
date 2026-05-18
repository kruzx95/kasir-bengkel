import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG atau PNG.' },
        { status: 400 }
      )
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5 MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    // Save to private uploads directory (not public)
    const uploadDir = join(process.cwd(), 'uploads', 'receipts')
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(join(uploadDir, filename), buffer)

    const filePath = `/uploads/receipts/${filename}`

    return NextResponse.json({ success: true, path: filePath })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Gagal mengupload file' }, { status: 500 })
  }
}
