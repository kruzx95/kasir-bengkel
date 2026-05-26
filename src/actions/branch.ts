'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function getBranches() {
  const session = await getSession()
  if (!session) return []

  return prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  })
}

export async function getBranchById(id: string) {
  return prisma.branch.findUnique({
    where: { id },
  })
}

export async function updateBranch(
  id: string,
  data: {
    name: string
    address: string
    phone: string
    instagramHandle?: string
    facebookPage?: string
    whatsappNumber?: string
  }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    // Validate whatsappNumber: digits only, 10-15 chars if provided
    if (data.whatsappNumber && !/^\d{10,15}$/.test(data.whatsappNumber)) {
      return { success: false, message: 'Nomor WhatsApp harus berupa angka 10–15 digit' }
    }

    await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        instagramHandle: data.instagramHandle || null,
        facebookPage: data.facebookPage || null,
        whatsappNumber: data.whatsappNumber || null,
      },
    })

    return { success: true }
  } catch (error: unknown) {
    return { success: false, message: (error as Error).message || 'Gagal mengubah data cabang' }
  }
}

export async function createBranch(data: {
  code: string
  name: string
  address: string
  phone: string
  instagramHandle?: string
  facebookPage?: string
  whatsappNumber?: string
}) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    if (!data.code.trim() || !data.name.trim() || !data.address.trim()) {
      return { success: false, message: 'Kode, Nama, dan Alamat cabang wajib diisi' }
    }

    if (data.whatsappNumber && !/^\d{10,15}$/.test(data.whatsappNumber)) {
      return { success: false, message: 'Nomor WhatsApp harus berupa angka 10–15 digit' }
    }

    const existingCode = await prisma.branch.findUnique({ where: { code: data.code } })
    if (existingCode) {
      return { success: false, message: 'Kode cabang sudah digunakan, silakan pilih kode lain' }
    }

    await prisma.branch.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        address: data.address.trim(),
        phone: data.phone || null,
        instagramHandle: data.instagramHandle || null,
        facebookPage: data.facebookPage || null,
        whatsappNumber: data.whatsappNumber || null,
      },
    })

    return { success: true, message: 'Cabang berhasil ditambahkan' }
  } catch (error: unknown) {
    return { success: false, message: (error as Error).message || 'Gagal menambahkan cabang' }
  }
}

export async function deleteBranch(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    // Optional: check if branch has users/transactions before deleting to prevent FK constraints
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, transactions: true, spareparts: true }
        }
      }
    })

    if (!branch) return { success: false, message: 'Cabang tidak ditemukan' }

    if (branch._count.users > 0 || branch._count.transactions > 0 || branch._count.spareparts > 0) {
      // Soft delete by setting isActive to false instead of hard delete
      await prisma.branch.update({
        where: { id },
        data: { isActive: false }
      })
      return { success: true, message: 'Cabang memiliki data terkait, sehingga dinonaktifkan (Soft Delete)' }
    }

    await prisma.branch.delete({ where: { id } })
    return { success: true, message: 'Cabang berhasil dihapus' }
  } catch (error: unknown) {
    return { success: false, message: (error as Error).message || 'Gagal menghapus cabang' }
  }
}
