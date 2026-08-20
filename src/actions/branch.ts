'use server'

import { prisma } from '@/lib/prisma'
import { getSession, isDemoUser } from '@/lib/session'
import { createActivityLog, createDiffLog } from '@/lib/logger'

export async function getBranches() {
  const session = await getSession()
  if (!session) return []

  if (isDemoUser(session)) {
    return prisma.branch.findMany({
      where: { code: 'DEMO' },
      orderBy: { code: 'asc' },
    })
  }

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

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo Aktif: Pengubahan data cabang dinonaktifkan.' }
    }

    // Validate whatsappNumber: digits only, 10-15 chars if provided
    if (data.whatsappNumber && !/^\d{10,15}$/.test(data.whatsappNumber)) {
      return { success: false, message: 'Nomor WhatsApp harus berupa angka 10–15 digit' }
    }

    const existing = await prisma.branch.findUnique({ where: { id } })
    if (!existing) throw new Error('Cabang tidak ditemukan')

    const updated = await prisma.branch.update({
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

    await createDiffLog({
      action: 'BRANCH_UPDATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Data cabang "${updated.name}" (${updated.code}) diperbarui oleh ${session.name}`,
      before: {
        name: existing.name,
        address: existing.address,
        phone: existing.phone,
        whatsappNumber: existing.whatsappNumber,
      },
      after: {
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        whatsappNumber: updated.whatsappNumber,
      },
      branchId: updated.id,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
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

    if (isDemoUser(session)) {
      return { success: false, message: 'Fitur penambahan cabang dinonaktifkan pada Akun Demo.' }
    }

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

    const newBranch = await prisma.branch.create({
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

    await createActivityLog({
      action: 'BRANCH_CREATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Cabang baru "${newBranch.name}" (${newBranch.code}) dibuat oleh ${session.name}`,
      details: {
        id: newBranch.id,
        code: newBranch.code,
        name: newBranch.name,
        address: newBranch.address,
        phone: newBranch.phone,
      },
      branchId: newBranch.id,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
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

    if (isDemoUser(session)) {
      return { success: false, message: 'Fitur hapus cabang dinonaktifkan pada Akun Demo.' }
    }

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
      await prisma.branch.update({
        where: { id },
        data: { isActive: false }
      })

      await createActivityLog({
        action: 'BRANCH_DELETE',
        category: 'MASTER',
        level: 'CRITICAL',
        description: `Cabang "${branch.name}" (${branch.code}) dinonaktifkan (memiliki riwayat data)`,
        details: {
          id: branch.id,
          name: branch.name,
          userCount: branch._count.users,
          txCount: branch._count.transactions,
        },
        branchId: branch.id,
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
      })

      return { success: true, message: 'Cabang memiliki data terkait, sehingga dinonaktifkan (Soft Delete)' }
    }

    await prisma.branch.delete({ where: { id } })

    await createActivityLog({
      action: 'BRANCH_DELETE',
      category: 'MASTER',
      level: 'CRITICAL',
      description: `Cabang "${branch.name}" (${branch.code}) dihapus permanen oleh ${session.name}`,
      details: { id: branch.id, name: branch.name, code: branch.code },
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    return { success: true, message: 'Cabang berhasil dihapus' }
  } catch (error: unknown) {
    return { success: false, message: (error as Error).message || 'Gagal menghapus cabang' }
  }
}
