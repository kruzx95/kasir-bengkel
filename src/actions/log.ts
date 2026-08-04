'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export interface GetLogsFilter {
  branchId?: string
  category?: string
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

    const totalMaster = await prisma.activityLog.count({
      where: { ...where, category: 'MASTER' },
    })

    const totalSystem = await prisma.activityLog.count({
      where: { ...where, category: 'SYSTEM' },
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
        totalMaster,
        totalSystem,
      },
    }
  } catch (error) {
    console.error('Get Activity Logs Error:', error)
    return { success: false, error: 'Gagal mengambil data log' }
  }
}
