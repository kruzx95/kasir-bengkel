import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export type LogCategory = 'TRANSACTION' | 'STOCK' | 'MASTER' | 'USER' | 'FINANCE' | 'SYSTEM'
export type LogLevel = 'INFO' | 'WARNING' | 'CRITICAL'

export interface CreateLogParams {
  action: string
  category: LogCategory
  level?: LogLevel
  description: string
  details?: Record<string, unknown> | string | null
  branchId?: string | null
  userId?: string | null
  userName?: string
  userRole?: 'ADMIN' | 'KASIR'
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Creates an activity log entry asynchronously and non-blockingly.
 * Errors in logging are caught so primary actions are never disrupted.
 */
export async function createActivityLog(params: CreateLogParams) {
  try {
    let { branchId, userId, userName, userRole, ipAddress, userAgent } = params
    const level: LogLevel = params.level || 'INFO'

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

    // Try extracting client IP and User-Agent from request headers if available
    if (!ipAddress || !userAgent) {
      try {
        const { headers } = await import('next/headers')
        const headerList = await headers()
        if (!ipAddress) {
          const cfIp = headerList.get('cf-connecting-ip')
          const realIp = headerList.get('x-real-ip')
          const forwarded = headerList.get('x-forwarded-for')
          const clientIp = headerList.get('x-client-ip')
          const host = headerList.get('host')

          let rawIp =
            cfIp ||
            realIp ||
            (forwarded ? forwarded.split(',')[0].trim() : null) ||
            clientIp ||
            null

          if (!rawIp && host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
            rawIp = '127.0.0.1'
          }

          if (rawIp) {
            if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
              ipAddress = '127.0.0.1 (Localhost)'
            } else if (rawIp.startsWith('::ffff:')) {
              ipAddress = rawIp.replace('::ffff:', '')
            } else {
              ipAddress = rawIp
            }
          }
        }
        if (!userAgent) {
          userAgent = headerList.get('user-agent') || null
        }
      } catch {
        // Headers not available in this context (e.g. background job or seed)
      }
    }

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
        level: level,
        description: params.description,
        details: detailsStr,
        branchId: branchId || null,
        userId: userId || null,
        userName: userName,
        userRole: userRole,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
  } catch (error) {
    console.error('Failed to create activity log:', error)
  }
}

export interface CreateDiffLogParams<T extends Record<string, unknown>> {
  action: string
  category: LogCategory
  level?: LogLevel
  description: string
  before: T
  after: Partial<T>
  keysToTrack?: (keyof T)[]
  branchId?: string | null
  userId?: string | null
  userName?: string
  userRole?: 'ADMIN' | 'KASIR'
}

/**
 * Helper to record changes (Diff) between previous data state and new data state.
 */
export async function createDiffLog<T extends Record<string, unknown>>(params: CreateDiffLogParams<T>) {
  try {
    const { before, after, keysToTrack } = params
    const changes: Record<string, { before: unknown; after: unknown }> = {}
    const keys = keysToTrack || (Object.keys(after) as (keyof T)[])

    for (const key of keys) {
      const strKey = String(key)
      if (after[key] !== undefined && before[key] !== undefined && before[key] !== after[key]) {
        changes[strKey] = {
          before: before[key],
          after: after[key],
        }
      }
    }

    // Only log if there are actual detected differences
    if (Object.keys(changes).length === 0) {
      return
    }

    await createActivityLog({
      action: params.action,
      category: params.category,
      level: params.level || 'INFO',
      description: params.description,
      details: {
        changes,
        before,
        after,
      },
      branchId: params.branchId,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
    })
  } catch (error) {
    console.error('Failed to create diff log:', error)
  }
}
