'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { createActivityLog } from '@/lib/logger'

export interface GetLogsFilter {
  branchId?: string
  category?: string
  level?: string
  userId?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function getActivityLogs(filter: GetLogsFilter = {}) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const {
      branchId,
      category,
      level,
      userId,
      search,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = filter

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    const targetBranchId = isSuperAdmin ? branchId : (session.branchId ?? undefined)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (targetBranchId && targetBranchId !== 'all') {
      where.branchId = targetBranchId
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (level && level !== 'all') {
      where.level = level
    }

    if (userId && userId !== 'all') {
      where.userId = userId
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { description: { contains: search } },
        { action: { contains: search } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`)
      }
    }

    const total = await prisma.activityLog.count({ where })

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        branch: { select: { name: true, code: true } },
      },
    })

    const totalTransactions = await prisma.activityLog.count({
      where: { ...where, category: 'TRANSACTION' },
    })

    const totalStock = await prisma.activityLog.count({
      where: { ...where, category: 'STOCK' },
    })

    const totalCritical = await prisma.activityLog.count({
      where: { ...where, level: 'CRITICAL' },
    })

    const totalWarning = await prisma.activityLog.count({
      where: { ...where, level: 'WARNING' },
    })

    return {
      success: true,
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        total,
        totalTransactions,
        totalStock,
        totalCritical,
        totalWarning,
      },
    }
  } catch (error) {
    console.error('Get Activity Logs Error:', error)
    return { success: false, error: 'Gagal mengambil data log' }
  }
}

export async function getLogUsers() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return []

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    })

    return users
  } catch {
    return []
  }
}

export async function purgeOldLogs(daysToKeep: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    if (!isSuperAdmin) {
      return { success: false, message: 'Hanya Super Admin yang berhak membersihkan log sistem.' }
    }

    if (daysToKeep < 7) {
      return { success: false, message: 'Rentang waktu retensi minimal 7 hari.' }
    }

    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    const deleteResult = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    await createActivityLog({
      action: 'LOG_PURGE',
      category: 'SYSTEM',
      level: 'CRITICAL',
      description: `Pembersihan Audit Log: Sebanyak ${deleteResult.count} catatan log yang berusia lebih dari ${daysToKeep} hari berhasil dibersihkan oleh ${session.name}`,
      details: {
        daysToKeep,
        deletedCount: deleteResult.count,
        cutoffDate: cutoffDate.toISOString(),
      },
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/logs')
    return {
      success: true,
      message: `Berhasil membersihkan ${deleteResult.count} catatan log audit (data sebelum ${cutoffDate.toLocaleDateString('id-ID')}).`,
      deletedCount: deleteResult.count,
    }
  } catch (error) {
    console.error('Purge Old Logs Error:', error)
    return { success: false, message: 'Gagal melakukan pembersihan log audit.' }
  }
}
