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
