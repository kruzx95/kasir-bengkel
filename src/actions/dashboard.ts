'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function getDashboardMetrics() {
  const session = await getSession()
  if (!session) return null

  const targetBranch = session.role === 'KASIR' ? session.branchId : undefined

  // 1. Date ranges
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today

  // 2. Fetch Data
  
  // Today's Revenue
  const todayTransactions = await prisma.transaction.findMany({
    where: {
      ...(targetBranch ? { branchId: targetBranch } : {}),
      transactionDate: { gte: today },
      status: 'COMPLETED'
    },
    select: { total: true }
  })
  const dailyRevenue = todayTransactions.reduce((acc, curr) => acc + curr.total, 0)

  // This Month's Revenue
  const monthTransactions = await prisma.transaction.findMany({
    where: {
      ...(targetBranch ? { branchId: targetBranch } : {}),
      transactionDate: { gte: startOfMonth },
      status: 'COMPLETED'
    },
    select: { total: true }
  })
  const monthlyRevenue = monthTransactions.reduce((acc, curr) => acc + curr.total, 0)

  // Revenue by Branch (Admin only)
  let branchRevenueData: { name: string; revenue: number }[] = []
  if (session.role === 'ADMIN') {
    const allMonthTrans = await prisma.transaction.findMany({
      where: { 
        transactionDate: { gte: startOfMonth },
        status: 'COMPLETED'
      },
      select: { branch: { select: { name: true } }, total: true }
    })
    
    const branchMap: Record<string, number> = {}
    allMonthTrans.forEach(t => {
      branchMap[t.branch.name] = (branchMap[t.branch.name] || 0) + t.total
    })
    
    branchRevenueData = Object.entries(branchMap).map(([name, revenue]) => ({ name, revenue }))
  }

  // Trend 7 Days
  const last7DaysTrans = await prisma.transaction.findMany({
    where: {
      ...(targetBranch ? { branchId: targetBranch } : {}),
      transactionDate: { gte: sevenDaysAgo },
      status: 'COMPLETED'
    },
    select: { transactionDate: true, total: true }
  })

  const trendMap: Record<string, number> = {}
  // Initialize last 7 days
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

  // Top Items (This Month)
  const items = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        ...(targetBranch ? { branchId: targetBranch } : {}),
        transactionDate: { gte: startOfMonth },
        status: 'COMPLETED'
      }
    },
    select: { itemName: true, itemType: true, quantity: true, subtotal: true }
  })

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

  // Low Stock Items (< 5)
  const lowStockItems = await prisma.sparepart.findMany({
    where: {
      ...(targetBranch ? { branchId: targetBranch } : {}),
      isActive: true,
      stock: { lt: 5 } // Threshold is less than 5
    },
    select: { name: true, stock: true, branch: { select: { name: true } } },
    orderBy: { stock: 'asc' },
    take: 10
  })

  return {
    dailyRevenue,
    monthlyRevenue,
    trendData,
    branchRevenueData,
    topServices,
    topSpareparts,
    lowStockItems
  }
}
