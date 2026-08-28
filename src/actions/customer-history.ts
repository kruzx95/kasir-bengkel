'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export interface CustomerServiceHistoryItem {
  id: string
  itemType: 'SERVICE' | 'SPAREPART'
  itemName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface CustomerServiceHistoryRecord {
  id: string
  invoiceNumber: string
  transactionDate: Date
  status: string
  paymentMethod: string
  subtotal: number
  discount: number
  total: number
  paidAmount: number
  notes: string | null
  odometer: number | null
  odometerDelta: number | null
  mechanic: {
    id: string
    name: string
  } | null
  items: CustomerServiceHistoryItem[]
  branch: {
    id: string
    name: string
  }
}

export interface CustomerServiceHistoryResult {
  customer: {
    id: string
    name: string
    phone: string | null
    address: string | null
    plateNumber: string | null
    vehicleBrand: string | null
    vehicleType: string | null
    vehicleYear: string | null
    vehicleColor: string | null
    fuelType: string | null
    odometer: number | null
    branch: { id: string; name: string; code: string; phone: string | null; address: string | null }
  }
  transactions: CustomerServiceHistoryRecord[]
  summary: {
    totalTransactions: number
    totalAmount: number
    totalServiceItemsCount: number
    totalSparepartItemsCount: number
    lastOdometer: number | null
    firstOdometer: number | null
    totalOdometerTraveled: number | null
    averageSpendPerVisit: number
  }
  startDate: Date
  endDate: Date
}

export async function getCustomerServiceHistory(
  customerId: string,
  startDateStr?: string,
  endDateStr?: string,
  search?: string
): Promise<CustomerServiceHistoryResult | null> {
  const session = await getSession()
  if (!session) return null

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      branch: { select: { id: true, name: true, code: true, phone: true, address: true } },
    },
  })
  if (!customer) return null

  // Date filtering
  const today = new Date()
  let startDate: Date
  let endDate: Date

  if (startDateStr) {
    startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)
  } else {
    // Default 1 year back or 2020
    startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1)
    startDate.setHours(0, 0, 0, 0)
  }

  if (endDateStr) {
    endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)
  } else {
    endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)
  }

  // Find all transactions for this customer or with same plateNumber
  const whereTx: Record<string, unknown> = {
    OR: [
      { customerId: customer.id },
      ...(customer.plateNumber
        ? [
            {
              customer: {
                plateNumber: {
                  equals: customer.plateNumber.trim(),
                },
              },
            },
          ]
        : []),
    ],
    status: { not: 'CANCELLED' },
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (search && search.trim() !== '') {
    const q = search.trim()
    whereTx.AND = [
      {
        OR: [
          { invoiceNumber: { contains: q } },
          { notes: { contains: q } },
          { mechanic: { name: { contains: q } } },
          {
            items: {
              some: {
                itemName: { contains: q },
              },
            },
          },
        ],
      },
    ]
  }

  const rawTransactions = await prisma.transaction.findMany({
    where: whereTx,
    include: {
      branch: { select: { id: true, name: true } },
      mechanic: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          itemType: true,
          itemName: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate odometer deltas (chronological order for delta calculation)
  const chronological = [...rawTransactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  let previousOdo: number | null = null
  const odoDeltaMap = new Map<string, number | null>()

  chronological.forEach((tx) => {
    if (tx.odometer !== null && tx.odometer !== undefined) {
      if (previousOdo !== null) {
        const delta = tx.odometer - previousOdo
        odoDeltaMap.set(tx.id, delta > 0 ? delta : null)
      } else {
        odoDeltaMap.set(tx.id, null)
      }
      previousOdo = tx.odometer
    } else {
      odoDeltaMap.set(tx.id, null)
    }
  })

  const transactions: CustomerServiceHistoryRecord[] = rawTransactions.map((tx) => ({
    id: tx.id,
    invoiceNumber: tx.invoiceNumber,
    transactionDate: tx.createdAt,
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    subtotal: tx.subtotal,
    discount: tx.discount,
    total: tx.total,
    paidAmount: tx.paidAmount,
    notes: tx.notes,
    odometer: tx.odometer,
    odometerDelta: odoDeltaMap.get(tx.id) || null,
    mechanic: tx.mechanic,
    items: tx.items.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      itemName: i.itemName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    branch: tx.branch,
  }))

  // Calculate summary
  const totalTransactions = transactions.length
  const totalAmount = transactions.reduce((acc, t) => acc + t.total, 0)
  const totalServiceItemsCount = transactions.reduce(
    (acc, t) => acc + t.items.filter((i) => i.itemType === 'SERVICE').length,
    0
  )
  const totalSparepartItemsCount = transactions.reduce(
    (acc, t) => acc + t.items.filter((i) => i.itemType === 'SPAREPART').reduce((s, it) => s + it.quantity, 0),
    0
  )

  const odometersWithValues = chronological
    .map((t) => t.odometer)
    .filter((o): o is number => o !== null && o !== undefined && o > 0)

  const firstOdometer = odometersWithValues.length > 0 ? odometersWithValues[0] : null
  const lastOdometer =
    odometersWithValues.length > 0
      ? odometersWithValues[odometersWithValues.length - 1]
      : customer.odometer
  const totalOdometerTraveled =
    firstOdometer && lastOdometer && lastOdometer > firstOdometer
      ? lastOdometer - firstOdometer
      : null

  const averageSpendPerVisit =
    totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      plateNumber: customer.plateNumber,
      vehicleBrand: customer.vehicleBrand,
      vehicleType: customer.vehicleType,
      vehicleYear: customer.vehicleYear,
      vehicleColor: customer.vehicleColor,
      fuelType: customer.fuelType,
      odometer: customer.odometer,
      branch: customer.branch,
    },
    transactions,
    summary: {
      totalTransactions,
      totalAmount,
      totalServiceItemsCount,
      totalSparepartItemsCount,
      lastOdometer,
      firstOdometer,
      totalOdometerTraveled,
      averageSpendPerVisit,
    },
    startDate,
    endDate,
  }
}
