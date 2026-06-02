'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function getDashboardMetrics() {
  const session = await getSession()
  if (!session) return null

  const targetBranch = session.role === 'KASIR' ? (session.branchId || 'UNASSIGNED') : undefined

  // 1. Date ranges
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today

  // 2. Fetch semua data secara parallel untuk performa optimal
  const [
    todayTransactions,
    monthTransactions,
    prevMonthTransactions,
    allMonthTransForBranch,
    last7DaysTrans,
    items,
    prevMonthItems,
    lowStockItems,
  ] = await Promise.all([
    // Today's Revenue
    prisma.transaction.aggregate({
      where: {
        ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
        transactionDate: { gte: today },
        status: 'COMPLETED',
      },
      _sum: { total: true },
    }),

    // This Month's Revenue
    prisma.transaction.aggregate({
      where: {
        ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
        transactionDate: { gte: startOfMonth },
        status: 'COMPLETED',
      },
      _sum: { total: true },
    }),

    // Previous Month's Revenue
    prisma.transaction.aggregate({
      where: {
        ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
        transactionDate: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        status: 'COMPLETED',
      },
      _sum: { total: true },
    }),

    // Revenue by Branch (Admin only) — empty for KASIR
    session.role === 'ADMIN'
      ? prisma.transaction.findMany({
          where: {
            transactionDate: { gte: startOfMonth },
            status: 'COMPLETED',
          },
          select: { branch: { select: { name: true } }, total: true },
        })
      : Promise.resolve([]),

    // Trend 7 Days
    prisma.transaction.findMany({
      where: {
        ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
        transactionDate: { gte: sevenDaysAgo },
        status: 'COMPLETED',
      },
      select: { transactionDate: true, total: true },
    }),

    // Top Items (This Month)
    prisma.transactionItem.findMany({
      where: {
        transaction: {
          ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
          transactionDate: { gte: startOfMonth },
          status: 'COMPLETED',
        },
      },
      select: { itemName: true, itemType: true, quantity: true, subtotal: true },
    }),

    // Top Items (Previous Month)
    prisma.transactionItem.findMany({
      where: {
        transaction: {
          ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
          transactionDate: { gte: startOfPrevMonth, lte: endOfPrevMonth },
          status: 'COMPLETED',
        },
      },
      select: { itemName: true, itemType: true, quantity: true, subtotal: true },
    }),

    // Low Stock Items (< 5)
    prisma.sparepart.findMany({
      where: {
        ...(targetBranch !== undefined ? { branchId: targetBranch } : {}),
        isActive: true,
        stock: { lt: 5 },
      },
      select: { name: true, stock: true, branch: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ])

  // 3. Process results
  const dailyRevenue = todayTransactions._sum?.total || 0
  const monthlyRevenue = monthTransactions._sum?.total || 0
  const prevMonthRevenue = prevMonthTransactions._sum?.total || 0
  const prevMonthName = startOfPrevMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // Revenue by Branch
  let branchRevenueData: { name: string; revenue: number }[] = []
  if (session.role === 'ADMIN') {
    const branchMap: Record<string, number> = {}
    allMonthTransForBranch.forEach(t => {
      branchMap[t.branch.name] = (branchMap[t.branch.name] || 0) + t.total
    })
    branchRevenueData = Object.entries(branchMap).map(([name, revenue]) => ({ name, revenue }))
  }

  // Trend 7 Days
  const trendMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(sevenDaysAgo.getDate() + i)
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    trendMap[label] = 0
  }
  last7DaysTrans.forEach(t => {
    const label = new Date(t.transactionDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    if (trendMap[label] !== undefined) {
      trendMap[label] += t.total
    }
  })
  const trendData = Object.entries(trendMap).map(([date, revenue]) => ({ date, revenue }))

  // Top Items
  const itemMap: Record<string, { name: string, type: string, qty: number, revenue: number }> = {}
  items.forEach(item => {
    if (!itemMap[item.itemName]) {
      itemMap[item.itemName] = { name: item.itemName, type: item.itemType, qty: 0, revenue: 0 }
    }
    itemMap[item.itemName].qty += item.quantity
    itemMap[item.itemName].revenue += item.subtotal
  })
  const sortedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty)
  const topServices = sortedItems.filter(i => i.type === 'SERVICE').slice(0, 5)
  const topSpareparts = sortedItems.filter(i => i.type === 'SPAREPART').slice(0, 5)

  // Top Items (Previous Month)
  const prevItemMap: Record<string, { name: string, type: string, qty: number, revenue: number }> = {}
  prevMonthItems.forEach(item => {
    if (!prevItemMap[item.itemName]) {
      prevItemMap[item.itemName] = { name: item.itemName, type: item.itemType, qty: 0, revenue: 0 }
    }
    prevItemMap[item.itemName].qty += item.quantity
    prevItemMap[item.itemName].revenue += item.subtotal
  })
  const prevSortedItems = Object.values(prevItemMap).sort((a, b) => b.qty - a.qty)
  const prevTopServices = prevSortedItems.filter(i => i.type === 'SERVICE').slice(0, 5)
  const prevTopSpareparts = prevSortedItems.filter(i => i.type === 'SPAREPART').slice(0, 5)

  return {
    dailyRevenue,
    monthlyRevenue,
    trendData,
    branchRevenueData,
    topServices,
    topSpareparts,
    lowStockItems,
    prevMonth: {
      name: prevMonthName,
      revenue: prevMonthRevenue,
      topServices: prevTopServices,
      topSpareparts: prevTopSpareparts,
    }
  }
}
