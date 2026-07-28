'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getMechanics(branchId?: string) {
  const session = await getSession()
  if (!session) return []

  try {
    return await prisma.mechanic.findMany({
      where: getBranchFilter(session, branchId),
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
    if (!session) throw new Error('Unauthorized')

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    const targetBranchId = !isSuperAdmin ? session.branchId : data.branchId
    if (!targetBranchId) throw new Error('Cabang harus dipilih')

    await prisma.mechanic.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        branchId: targetBranchId
      }
    })

    revalidatePath('/admin/master/mechanics')
    revalidatePath('/kasir/mekanik')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambah mekanik'
    return { success: false, message }
  }
}

export async function updateMechanic(id: string, data: { name: string; phone?: string; isActive: boolean }) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    await prisma.mechanic.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        isActive: data.isActive
      }
    })

    revalidatePath('/admin/master/mechanics')
    revalidatePath('/kasir/mekanik')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah mekanik'
    return { success: false, message }
  }
}

export async function deleteMechanic(id: string) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

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
