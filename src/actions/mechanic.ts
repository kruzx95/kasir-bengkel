'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getMechanics(branchId?: string) {
  const session = await getSession()
  if (!session) return []

  const targetBranch = session.role === 'KASIR' ? session.branchId : branchId

  try {
    return await prisma.mechanic.findMany({
      where: targetBranch ? { branchId: targetBranch } : {},
      include: {
        branch: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching mechanics:', error)
    return []
  }
}

export async function createMechanic(data: { name: string; phone?: string; branchId: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.mechanic.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        branchId: data.branchId
      }
    })

    revalidatePath('/admin/master/mechanics')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambah mekanik'
    return { success: false, message }
  }
}

export async function updateMechanic(id: string, data: { name: string; phone?: string; isActive: boolean }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.mechanic.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        isActive: data.isActive
      }
    })

    revalidatePath('/admin/master/mechanics')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah mekanik'
    return { success: false, message }
  }
}

export async function deleteMechanic(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    // Optional: Check if mechanic has transactions. If yes, soft delete (isActive = false) instead of hard delete.
    const hasTransactions = await prisma.transaction.count({ where: { mechanicId: id } })
    if (hasTransactions > 0) {
      await prisma.mechanic.update({
        where: { id },
        data: { isActive: false }
      })
      revalidatePath('/admin/master/mechanics')
      return { success: true, message: 'Mekanik di-nonaktifkan karena sudah memiliki histori transaksi' }
    }

    await prisma.mechanic.delete({ where: { id } })
    revalidatePath('/admin/master/mechanics')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus mekanik'
    return { success: false, message }
  }
}
