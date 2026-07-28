'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getCustomersDueForService(monthsLimit: number, branchId?: string) {
  const session = await getSession()
  if (!session) return []

  const thresholdDate = new Date()
  thresholdDate.setMonth(thresholdDate.getMonth() - monthsLimit)

  // Find customers whose last transaction is BEFORE the threshold date
  // AND either they have never been reminded OR their last reminder was before the threshold date
  
  // To do this accurately in Prisma, we first find the latest transaction for each customer
  // This is a bit tricky with Prisma's basic query, so we can fetch customers with their latest transaction
  const customers = await prisma.customer.findMany({
    where: {
      ...getBranchFilter(session, branchId),
      // We only care about customers who have actually done service
      transactions: { some: {} },
      OR: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { lt: thresholdDate } }
      ]
    },
    include: {
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 1,
        include: {
          items: { select: { itemName: true } }
        }
      }
    }
  })

  // Now filter in memory for those whose latest transaction is older than the threshold
  const dueCustomers = customers.filter(c => {
    if (c.transactions.length === 0) return false
    return c.transactions[0].transactionDate < thresholdDate
  })

  // Sort by the oldest transaction date (most overdue)
  dueCustomers.sort((a, b) => a.transactions[0].transactionDate.getTime() - b.transactions[0].transactionDate.getTime())

  return dueCustomers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    plateNumber: c.plateNumber,
    vehicleBrand: c.vehicleBrand,
    vehicleType: c.vehicleType,
    lastServiceDate: c.transactions[0].transactionDate,
    lastServiceItems: c.transactions[0].items.map(i => i.itemName),
    lastReminderSentAt: c.lastReminderSentAt
  }))
}

export async function markReminderSent(customerId: string) {
  const session = await getSession()
  if (!session) return { success: false, message: 'Unauthorized' }

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: { lastReminderSentAt: new Date() }
    })
    
    revalidatePath('/admin/reminder')
    revalidatePath('/kasir/reminder')
    return { success: true }
  } catch (error) {
    console.error('Mark Reminder Sent Error:', error)
    return { success: false, message: 'Gagal menandai reminder' }
  }
}
