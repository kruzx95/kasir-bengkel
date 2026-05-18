'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function getReportData(startDateStr?: string, endDateStr?: string, branchId?: string) {
  const session = await getSession()
  if (!session) return { transactions: [], summary: { total: 0, service: 0, sparepart: 0, discount: 0 } }

  // Enforce branch filter for Kasir
  const targetBranch = session.role === 'KASIR' ? session.branchId : (branchId || undefined)

  // Defaults: 1st of current month to today
  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        ...(targetBranch ? { branchId: targetBranch } : {}),
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED'
      },
      select: {
        id: true,
        invoiceNumber: true,
        transactionDate: true,
        type: true,
        paymentMethod: true,
        subtotal: true,
        discount: true,
        total: true,
        notes: true,
        branch: { select: { name: true } },
        customer: { select: { name: true, plateNumber: true } },
        user: { select: { name: true } },
        items: {
          select: {
            itemName: true,
            itemType: true,
            quantity: true,
            unitPrice: true,
            subtotal: true
          }
        }
      },
      orderBy: { transactionDate: 'desc' }
    })

    let serviceRev = 0
    let sparepartRev = 0
    let totalDiscount = 0
    let grandTotal = 0

    transactions.forEach(tx => {
      grandTotal += tx.total
      totalDiscount += tx.discount
      
      tx.items.forEach(item => {
        if (item.itemType === 'SERVICE') serviceRev += item.subtotal
        if (item.itemType === 'SPAREPART') sparepartRev += item.subtotal
      })
    })

    return {
      transactions,
      summary: {
        total: grandTotal,
        service: serviceRev,
        sparepart: sparepartRev,
        discount: totalDiscount
      }
    }
  } catch (error) {
    console.error('Report fetching error:', error)
    return { transactions: [], summary: { total: 0, service: 0, sparepart: 0, discount: 0 } }
  }
}

export async function getRestockReportData(startDateStr?: string, endDateStr?: string, branchId?: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { restocks: [], summary: { total: 0, count: 0, topSparepart: null as string | null } }
  }

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)

  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const restocks = await prisma.restock.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        date: { gte: startDate, lte: endDate },
      },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        items: {
          include: {
            sparepart: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    let grandTotal = 0
    const sparepartTotals: Record<string, { name: string; total: number }> = {}

    restocks.forEach((r) => {
      grandTotal += r.total
      r.items.forEach((item) => {
        const key = item.sparepartId
        if (!sparepartTotals[key]) {
          sparepartTotals[key] = { name: item.sparepart.name, total: 0 }
        }
        sparepartTotals[key].total += item.subtotal
      })
    })

    const topSparepart = Object.values(sparepartTotals).sort((a, b) => b.total - a.total)[0]?.name ?? null

    return {
      restocks,
      summary: {
        total: grandTotal,
        count: restocks.length,
        topSparepart,
      },
    }
  } catch (error) {
    console.error('Restock report error:', error)
    return { restocks: [], summary: { total: 0, count: 0, topSparepart: null } }
  }
}
