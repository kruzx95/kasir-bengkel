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
