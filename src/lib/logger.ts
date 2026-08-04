import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export type LogCategory = 'TRANSACTION' | 'STOCK' | 'MASTER' | 'USER' | 'SYSTEM'

export interface CreateLogParams {
  action: string
  category: LogCategory
  description: string
  details?: Record<string, unknown> | string | null
  branchId?: string | null
  userId?: string | null
  userName?: string
  userRole?: 'ADMIN' | 'KASIR'
}

/**
 * Creates an activity log entry asynchronously and non-blockingly.
 * Errors in logging are caught so primary actions are never disrupted.
 */
export async function createActivityLog(params: CreateLogParams) {
  try {
    let { branchId, userId, userName, userRole } = params

    if (!userId || !userName || !userRole) {
      const session = await getSession().catch(() => null)
      if (session) {
        userId = userId ?? session.userId
        userName = userName ?? session.name
        userRole = userRole ?? session.role
        branchId = branchId ?? session.branchId ?? null
      }
    }

    if (!userName) userName = 'Sistem'
    if (!userRole) userRole = 'ADMIN'

    let detailsStr: string | null = null
    if (params.details) {
      if (typeof params.details === 'string') {
        detailsStr = params.details
      } else {
        detailsStr = JSON.stringify(params.details, null, 2)
      }
    }

    await prisma.activityLog.create({
      data: {
        action: params.action,
        category: params.category,
        description: params.description,
        details: detailsStr,
        branchId: branchId || null,
        userId: userId || null,
        userName: userName,
        userRole: userRole,
      },
    })
  } catch (error) {
    console.error('Failed to create activity log:', error)
  }
}
