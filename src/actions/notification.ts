'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { Prisma } from '@/generated/prisma/client'

export interface NotificationItem {
  id: string
  type: 'LOW_STOCK' | 'INDENT_OVERDUE' | 'CORPORATE_PENDING'
  title: string
  message: string
  href: string
  severity: 'warning' | 'danger' | 'info'
  date?: string | Date
}

export interface NotificationSummary {
  lowStock: number
  indentOverdue: number
  corporatePending: number
}

export interface NotificationResponse {
  items: NotificationItem[]
  count: number
  summary: NotificationSummary
}

const MAX_ITEMS_PER_TYPE = 20

export async function getNotifications(): Promise<NotificationResponse> {
  const session = await getSession()
  if (!session) return { items: [], count: 0, summary: { lowStock: 0, indentOverdue: 0, corporatePending: 0 } }

  const branchId = session.role === 'KASIR' ? session.branchId : undefined
  const items: NotificationItem[] = []
  const summary: NotificationSummary = { lowStock: 0, indentOverdue: 0, corporatePending: 0 }

  // ──────────────────────────────────────────────
  // 1. LOW_STOCK — uses minStock per-item threshold
  //    Logic: stock=0 always shows, otherwise stock < minStock
  //    Uses raw query because Prisma doesn't support field-to-field comparison
  // ──────────────────────────────────────────────

  const branchFilter = branchId
    ? Prisma.sql`AND s.branch_id = ${branchId}`
    : Prisma.empty

  // Count total low-stock items (for summary badge)
  const [countResult] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM spareparts s
    WHERE s.isActive = true
      AND (s.stock = 0 OR s.stock < s.min_stock)
      ${branchFilter}
  `
  summary.lowStock = Number(countResult.count)

  // Fetch top N most critical items only (stock ASC = most empty first)
  const lowStockRows = await prisma.$queryRaw<
    Array<{ id: string; name: string; stock: number; branch_name: string }>
  >`
    SELECT s.id, s.name, s.stock, b.name as branch_name
    FROM spareparts s
    JOIN branches b ON b.id = s.branch_id
    WHERE s.isActive = true
      AND (s.stock = 0 OR s.stock < s.min_stock)
      ${branchFilter}
    ORDER BY s.stock ASC, s.name ASC
    LIMIT ${MAX_ITEMS_PER_TYPE}
  `

  lowStockRows.forEach(sp => {
    items.push({
      id: `stock-${sp.id}`,
      type: 'LOW_STOCK',
      title: 'Stok Menipis',
      message: `${sp.name} tersisa ${sp.stock} pcs di ${sp.branch_name}`,
      href: '/admin/master/spareparts',
      severity: sp.stock === 0 ? 'danger' : 'warning',
    })
  })

  // ──────────────────────────────────────────────
  // Admin Only Notifications
  // ──────────────────────────────────────────────
  if (session.role === 'ADMIN') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Parallel fetch: counts + limited items for each type
    const [
      overdueCount,
      corporateCount,
      overdueIndents,
      pendingCorporate
    ] = await Promise.all([
      // Count overdue indents
      prisma.indentOrder.count({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          expectedDate: { lt: today }
        }
      }),

      // Count pending corporate > 30 days
      prisma.transaction.count({
        where: {
          status: 'PENDING_CORPORATE',
          transactionDate: { lt: thirtyDaysAgo }
        }
      }),

      // 2. INDENT_OVERDUE — limited
      prisma.indentOrder.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          expectedDate: { lt: today }
        },
        select: {
          id: true,
          supplierName: true,
          expectedDate: true,
          branch: { select: { name: true } }
        },
        orderBy: { expectedDate: 'asc' },
        take: MAX_ITEMS_PER_TYPE
      }),

      // 3. CORPORATE_PENDING > 30 Days — limited
      prisma.transaction.findMany({
        where: {
          status: 'PENDING_CORPORATE',
          transactionDate: { lt: thirtyDaysAgo }
        },
        select: {
          id: true,
          invoiceNumber: true,
          transactionDate: true,
          customer: { select: { name: true } },
          branch: { select: { name: true } }
        },
        orderBy: { transactionDate: 'asc' },
        take: MAX_ITEMS_PER_TYPE
      })
    ])

    summary.indentOverdue = overdueCount
    summary.corporatePending = corporateCount

    overdueIndents.forEach(indent => {
      const expected = new Date(indent.expectedDate!)
      const diffTime = Math.abs(today.getTime() - expected.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      items.push({
        id: `indent-${indent.id}`,
        type: 'INDENT_OVERDUE',
        title: 'Indent Terlambat',
        message: `Pesanan ke ${indent.supplierName} untuk ${indent.branch.name} telat ${diffDays} hari`,
        href: `/admin/indent`,
        severity: 'danger',
        date: indent.expectedDate || undefined
      })
    })

    pendingCorporate.forEach(tx => {
      const txDate = new Date(tx.transactionDate)
      const diffTime = Math.abs(today.getTime() - txDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      items.push({
        id: `corp-${tx.id}`,
        type: 'CORPORATE_PENDING',
        title: 'Tagihan Korporat Lama',
        message: `Tagihan ${tx.customer?.name || 'Korporat'} (${tx.invoiceNumber}) belum dibayar selama ${diffDays} hari`,
        href: `/admin/korporat`,
        severity: 'warning',
        date: tx.transactionDate
      })
    })
  }

  // Sort: danger first, then warning, then info
  items.sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const totalCount = summary.lowStock + summary.indentOverdue + summary.corporatePending

  return { items, count: totalCount, summary }
}
