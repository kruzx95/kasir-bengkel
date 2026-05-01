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
