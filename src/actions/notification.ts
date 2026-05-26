'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export interface NotificationItem {
  id: string
  type: 'LOW_STOCK' | 'INDENT_OVERDUE' | 'CORPORATE_PENDING'
  title: string
  message: string
  href: string
  severity: 'warning' | 'danger' | 'info'
  date?: string | Date
}

export async function getNotifications() {
  const session = await getSession()
  if (!session) return { items: [], count: 0 }

  const branchId = session.role === 'KASIR' ? session.branchId : undefined
  const items: NotificationItem[] = []

  // 1. LOW_STOCK (Kasir & Admin)
  const lowStockItems = await prisma.sparepart.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      isActive: true,
      stock: { lt: 5 }
    },
    include: { branch: true },
    orderBy: { stock: 'asc' }
  })

  lowStockItems.forEach(sp => {
    items.push({
      id: `stock-${sp.id}`,
      type: 'LOW_STOCK',
      title: 'Stok Menipis',
      message: `${sp.name} tersisa ${sp.stock} pcs di ${sp.branch.name}`,
      href: '/admin/master/spareparts',
      severity: sp.stock === 0 ? 'danger' : 'warning',
    })
  })

  // Admin Only Notifications
  if (session.role === 'ADMIN') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Parallel fetch for Admin notifications
    const [overdueIndents, pendingCorporate] = await Promise.all([
      // 2. INDENT_OVERDUE (Admin Only)
      prisma.indentOrder.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          expectedDate: { lt: today }
        },
        include: { branch: true }
      }),

      // 3. CORPORATE_PENDING > 30 Days (Admin Only)
      prisma.transaction.findMany({
        where: {
          status: 'PENDING_CORPORATE',
          transactionDate: { lt: thirtyDaysAgo }
        },
        include: { customer: true, branch: true }
      })
    ])

    overdueIndents.forEach(indent => {
      // Calculate days overdue
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
      // Calculate days pending
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

  // Sort: highest severity first, then by type
  items.sort((a, b) => {
    if (a.severity === 'danger' && b.severity !== 'danger') return -1
    if (a.severity !== 'danger' && b.severity === 'danger') return 1
    return 0
  })

  return { items, count: items.length }
}
