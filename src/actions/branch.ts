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

export async function updateBranch(id: string, data: { name: string; address: string; phone: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone
      }
    })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal mengubah data cabang' }
  }
}
