import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename } = await params

    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = join(process.cwd(), 'uploads', 'receipts', filename)
    const fileBuffer = await readFile(filePath)

    const ext = filename.split('.').pop()?.toLowerCase()
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

    return new NextResponse(fileBuffer, {
      headers: { 'Content-Type': contentType },
    })
  } catch {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
  }
}
