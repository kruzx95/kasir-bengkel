'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'

export async function getReportData(
  startDateStr?: string,
  endDateStr?: string,
  branchId?: string,
  txCategory: 'ALL' | 'REGULAR' | 'CORPORATE' = 'ALL'
) {
  const session = await getSession()
  if (!session) return { transactions: [], summary: { total: 0, service: 0, sparepart: 0, discount: 0, pendingCorporate: 0 } }

  // Defaults: 1st of current month to today
  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      ...getBranchFilter(session, branchId),
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (txCategory === 'REGULAR') {
      whereClause.status = { in: ['COMPLETED', 'PENDING_PAYMENT'] }
      whereClause.OR = [
        { customerId: null },
        { customer: { corporateCustomerId: null } },
      ]
    } else if (txCategory === 'CORPORATE') {
      whereClause.OR = [
        { status: 'PENDING_CORPORATE' },
        { customer: { corporateCustomerId: { not: null } } },
      ]
    } else {
      whereClause.status = { in: ['COMPLETED', 'PENDING_CORPORATE', 'PENDING_PAYMENT'] }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        transactionDate: true,
        type: true,
        status: true,
        paymentMethod: true,
        paidAmount: true,
        changeAmount: true,
        payments: {
          select: {
            paymentMethod: true,
            amount: true,
          }
        },
        subtotal: true,
        discount: true,
        total: true,
        notes: true,
        branch: { select: { name: true } },
        customer: {
          select: {
            name: true,
            plateNumber: true,
            corporateCustomerId: true,
            corporateCustomer: { select: { id: true, name: true } },
          },
        },
        user: { select: { name: true } },
        items: {
          select: {
            itemName: true,
            itemType: true,
            quantity: true,
            unitPrice: true,
            buyPrice: true,
            subtotal: true,
            sparepart: {
              select: {
                buyPrice: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' }
    })

    const mappedTransactions = transactions.map(tx => ({
      ...tx,
      items: tx.items.map(it => ({
        itemName: it.itemName,
        itemType: it.itemType,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        buyPrice: it.itemType === 'SPAREPART' ? (it.buyPrice ?? it.sparepart?.buyPrice ?? 0) : 0,
        subtotal: it.subtotal,
      }))
    }))

    let serviceRev = 0
    let sparepartRev = 0
    let totalDiscount = 0
    let grandTotal = 0
    let pendingCorporate = 0
    let pendingReceivable = 0
    let cashTotal = 0
    let transferTotal = 0
    let qrisTotal = 0

    mappedTransactions.forEach(tx => {
      grandTotal += tx.total
      totalDiscount += tx.discount
      if (tx.status === 'PENDING_CORPORATE') {
        pendingCorporate += tx.total
      } else if (tx.status === 'PENDING_PAYMENT') {
        const remaining = Math.max(0, tx.total - (tx.paidAmount || 0))
        pendingReceivable += remaining
        if (tx.payments && tx.payments.length > 0) {
          tx.payments.forEach(p => {
            if (p.paymentMethod === 'CASH') cashTotal += p.amount
            else if (p.paymentMethod === 'TRANSFER') transferTotal += p.amount
            else if (p.paymentMethod === 'QRIS') qrisTotal += p.amount
          })
        }
      } else {
        if (tx.payments && tx.payments.length > 0) {
          tx.payments.forEach(p => {
            if (p.paymentMethod === 'CASH') cashTotal += p.amount
            else if (p.paymentMethod === 'TRANSFER') transferTotal += p.amount
            else if (p.paymentMethod === 'QRIS') qrisTotal += p.amount
          })
        } else {
          if (tx.paymentMethod === 'CASH') cashTotal += tx.total
          else if (tx.paymentMethod === 'TRANSFER') transferTotal += tx.total
          else if (tx.paymentMethod === 'QRIS') qrisTotal += tx.total
        }
      }

      tx.items.forEach(item => {
        if (item.itemType === 'SERVICE') serviceRev += item.subtotal
        if (item.itemType === 'SPAREPART') sparepartRev += item.subtotal
      })
    })

    return {
      transactions: mappedTransactions,
      summary: {
        total: grandTotal,
        service: serviceRev,
        sparepart: sparepartRev,
        discount: totalDiscount,
        pendingCorporate,
        pendingReceivable,
        cashTotal,
        transferTotal,
        qrisTotal,
      }
    }
  } catch (error) {
    console.error('Report fetching error:', error)
    return {
      transactions: [],
      summary: {
        total: 0,
        service: 0,
        sparepart: 0,
        discount: 0,
        pendingCorporate: 0,
        cashTotal: 0,
        transferTotal: 0,
        qrisTotal: 0,
      }
    }
  }
}

export async function getRestockReportData(startDateStr?: string, endDateStr?: string, branchId?: string) {
  const session = await getSession()
  if (!session) {
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
        ...getBranchFilter(session, branchId),
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
  } catch {
    return { restocks: [], summary: { total: 0, count: 0, topSparepart: null as string | null } }
  }
}

export async function getIndentReportData(
  startDateStr?: string,
  endDateStr?: string,
  branchId?: string,
  type: 'RESTOCK' | 'CUSTOMER' | 'ALL' = 'ALL',
  status?: 'PENDING' | 'PARTIAL' | 'RECEIVED'
) {
  const session = await getSession()
  if (!session) {
    return { indents: [], summary: { count: 0, totalValue: 0, pendingCount: 0, partialCount: 0, receivedCount: 0, topSparepart: null as string | null } }
  }

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)

  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const indents = await prisma.indentOrder.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        orderDate: { gte: startDate, lte: endDate },
        ...(type !== 'ALL' ? { type } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            sparepart: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    })

    let totalValue = 0
    let pendingCount = 0
    let partialCount = 0
    let receivedCount = 0
    const sparepartTotals: Record<string, { name: string; total: number }> = {}

    indents.forEach((order) => {
      if (order.status === 'PENDING') pendingCount += 1
      if (order.status === 'PARTIAL') partialCount += 1
      if (order.status === 'RECEIVED') receivedCount += 1

      order.items.forEach((item) => {
        const value = item.quantity * item.estimatedPrice
        totalValue += value

        const key = item.sparepartId
        if (!sparepartTotals[key]) {
          sparepartTotals[key] = { name: item.sparepart.name, total: 0 }
        }
        sparepartTotals[key].total += item.quantity
      })
    })

    const topSparepart = Object.values(sparepartTotals).sort((a, b) => b.total - a.total)[0]?.name ?? null

    return {
      indents,
      summary: {
        count: indents.length,
        totalValue,
        pendingCount,
        partialCount,
        receivedCount,
        topSparepart,
      },
    }
  } catch {
    return { indents: [], summary: { count: 0, totalValue: 0, pendingCount: 0, partialCount: 0, receivedCount: 0, topSparepart: null as string | null } }
  }
}

export async function getCorporateReportData(
  startDateStr?: string,
  endDateStr?: string,
  branchId?: string,
  corporateCustomerId?: string
) {
  const session = await getSession()
  if (!session) {
    return {
      corporates: [],
      transactions: [],
      payments: [],
      ledgers: [],
      summary: { totalInvoice: 0, totalPaid: 0, outstanding: 0, activeCompanies: 0 },
    }
  }

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const corporates = await prisma.corporateCustomer.findMany({
      where: {
        isActive: true,
        ...getBranchFilter(session, branchId),
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        contactPhone: true,
        billingCycle: true,
        branch: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const corpWhere = corporateCustomerId
      ? { id: corporateCustomerId }
      : { isActive: true, ...getBranchFilter(session, branchId) }

    const targetCorporates = await prisma.corporateCustomer.findMany({
      where: corpWhere,
      select: {
        id: true,
        name: true,
        contactPerson: true,
        contactPhone: true,
        billingCycle: true,
        customers: { select: { id: true, name: true, plateNumber: true } },
      },
    })

    const customerIds = targetCorporates.flatMap((c) => c.customers.map((cust) => cust.id))

    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: { in: customerIds },
        transactionDate: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'PENDING_CORPORATE'] },
      },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        customer: {
          select: {
            name: true,
            plateNumber: true,
            vehicleType: true,
            corporateCustomer: { select: { id: true, name: true } },
          },
        },
        items: {
          select: {
            itemName: true,
            itemType: true,
            quantity: true,
            unitPrice: true,
            buyPrice: true,
            subtotal: true,
            sparepart: {
              select: {
                buyPrice: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    })

    const mappedTransactions = transactions.map((tx) => ({
      ...tx,
      items: tx.items.map((it) => ({
        itemName: it.itemName,
        itemType: it.itemType,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        buyPrice: it.itemType === 'SPAREPART' ? (it.buyPrice ?? it.sparepart?.buyPrice ?? 0) : 0,
        subtotal: it.subtotal,
      })),
    }))

    const corpIdsFilter = corporateCustomerId ? [corporateCustomerId] : targetCorporates.map((c) => c.id)
    const payments = await prisma.corporatePayment.findMany({
      where: {
        corporateCustomerId: { in: corpIdsFilter },
        paidAt: { gte: startDate, lte: endDate },
        voidedAt: null,
      },
      include: {
        corporateCustomer: { select: { id: true, name: true } },
        branch: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { paidAt: 'desc' },
    })

    let totalInvoice = 0
    let totalPendingInvoice = 0
    transactions.forEach((tx) => {
      totalInvoice += tx.total
      if (tx.status === 'PENDING_CORPORATE') {
        totalPendingInvoice += tx.total
      }
    })

    let totalPaid = 0
    payments.forEach((p) => {
      totalPaid += p.amount
    })

    const ledgerMap: Record<
      string,
      {
        id: string
        name: string
        contactPerson: string | null
        contactPhone: string | null
        billingCycle: string
        transactionCount: number
        totalInvoice: number
        totalPaid: number
        outstanding: number
      }
    > = {}

    targetCorporates.forEach((corp) => {
      ledgerMap[corp.id] = {
        id: corp.id,
        name: corp.name,
        contactPerson: corp.contactPerson,
        contactPhone: corp.contactPhone,
        billingCycle: corp.billingCycle,
        transactionCount: 0,
        totalInvoice: 0,
        totalPaid: 0,
        outstanding: 0,
      }
    })

    transactions.forEach((tx) => {
      const corpId = tx.customer?.corporateCustomer?.id
      if (corpId && ledgerMap[corpId]) {
        ledgerMap[corpId].transactionCount += 1
        ledgerMap[corpId].totalInvoice += tx.total
        if (tx.status === 'PENDING_CORPORATE') {
          ledgerMap[corpId].outstanding += tx.total
        }
      }
    })

    payments.forEach((p) => {
      const corpId = p.corporateCustomer.id
      if (corpId && ledgerMap[corpId]) {
        ledgerMap[corpId].totalPaid += p.amount
      }
    })

    const ledgers = Object.values(ledgerMap).filter(
      (l) => l.transactionCount > 0 || l.totalPaid > 0 || l.outstanding > 0
    )

    return {
      corporates,
      transactions: mappedTransactions,
      payments,
      ledgers,
      summary: {
        totalInvoice,
        totalPaid,
        outstanding: totalPendingInvoice,
        activeCompanies: ledgers.length,
      },
    }
  } catch (error) {
    console.error('getCorporateReportData error:', error)
    return {
      corporates: [],
      transactions: [],
      payments: [],
      ledgers: [],
      summary: { totalInvoice: 0, totalPaid: 0, outstanding: 0, activeCompanies: 0 },
    }
  }
}

export async function getMechanicReportData(
  startDateStr?: string,
  endDateStr?: string,
  branchId?: string,
  mechanicId?: string
) {
  const session = await getSession()
  if (!session) return { mechanics: [], summary: { totalServiceRevenue: 0, totalMotorHandled: 0, activeMechanicsCount: 0 } }

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const mechanicsList = await prisma.mechanic.findMany({
      where: {
        isActive: true,
        ...getBranchFilter(session, branchId),
        ...(mechanicId ? { id: mechanicId } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        branch: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const transactions = await prisma.transaction.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        mechanicId: { in: mechanicsList.map((m) => m.id) },
        transactionDate: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'PENDING_CORPORATE'] },
      },
      include: {
        mechanic: { select: { id: true, name: true } },
        branch: { select: { name: true } },
        customer: { select: { name: true, plateNumber: true, vehicleType: true } },
        items: {
          select: {
            itemName: true,
            itemType: true,
            quantity: true,
            unitPrice: true,
            buyPrice: true,
            subtotal: true,
            sparepart: {
              select: {
                buyPrice: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    })

    const mechanicSummaryMap: Record<
      string,
      {
        id: string
        name: string
        phone: string | null
        branchName: string
        jobCount: number
        serviceRevenue: number
        sparepartRevenue: number
        totalRevenue: number
        transactions: Array<{
          id: string
          invoiceNumber: string
          transactionDate: Date
          total: number
          customer: { name: string; plateNumber: string | null; vehicleType: string | null } | null
          items: Array<{ itemName: string; itemType: string; quantity: number; unitPrice: number; buyPrice: number; subtotal: number }>
        }>
      }
    > = {}

    mechanicsList.forEach((m) => {
      mechanicSummaryMap[m.id] = {
        id: m.id,
        name: m.name,
        phone: m.phone,
        branchName: m.branch.name,
        jobCount: 0,
        serviceRevenue: 0,
        sparepartRevenue: 0,
        totalRevenue: 0,
        transactions: [],
      }
    })

    let grandServiceRevenue = 0
    let grandTotalJobs = 0

    transactions.forEach((tx) => {
      if (tx.mechanicId && mechanicSummaryMap[tx.mechanicId]) {
        const m = mechanicSummaryMap[tx.mechanicId]
        m.jobCount += 1
        m.transactions.push({
          id: tx.id,
          invoiceNumber: tx.invoiceNumber,
          transactionDate: tx.transactionDate,
          total: tx.total,
          customer: tx.customer,
          items: tx.items.map((it) => ({
            itemName: it.itemName,
            itemType: it.itemType,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            buyPrice: it.itemType === 'SPAREPART' ? (it.buyPrice ?? it.sparepart?.buyPrice ?? 0) : 0,
            subtotal: it.subtotal,
          })),
        })
        grandTotalJobs += 1

        let srvTotal = 0
        let spTotal = 0
        tx.items.forEach((item) => {
          if (item.itemType === 'SERVICE') srvTotal += item.subtotal
          if (item.itemType === 'SPAREPART') spTotal += item.subtotal
        })

        m.serviceRevenue += srvTotal
        m.sparepartRevenue += spTotal
        m.totalRevenue += tx.total
        grandServiceRevenue += srvTotal
      }
    })

    const mechanicReports = Object.values(mechanicSummaryMap)

    return {
      mechanics: mechanicReports,
      summary: {
        totalServiceRevenue: grandServiceRevenue,
        totalMotorHandled: grandTotalJobs,
        activeMechanicsCount: mechanicsList.length,
      },
    }
  } catch (error) {
    console.error('getMechanicReportData error:', error)
    return {
      mechanics: [],
      summary: { totalServiceRevenue: 0, totalMotorHandled: 0, activeMechanicsCount: 0 },
    }
  }
}

export async function getProfitLossReportData(
  startDateStr?: string,
  endDateStr?: string,
  branchId?: string
) {
  const session = await getSession()
  if (!session) {
    return {
      transactions: [],
      sparepartProfitability: [],
      restocks: [],
      corporatePayments: [],
      summary: {
        serviceRevenue: 0,
        sparepartRevenue: 0,
        grossRevenue: 0,
        discount: 0,
        netRevenue: 0,
        cogsSparepart: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        serviceProfit: 0,
        sparepartProfit: 0,
        sparepartMarginPercent: 0,
        cashInflow: 0,
        transferInflow: 0,
        qrisInflow: 0,
        corporatePaymentsInflow: 0,
        totalCashInflow: 0,
        totalRestock: 0,
        restockPaid: 0,
        restockUnpaid: 0,
        netCashFlow: 0,
        regularReceivable: 0,
        corporateReceivable: 0,
        totalReceivable: 0,
        totalTransactions: 0,
        totalRestockCount: 0,
      },
    }
  }

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)

  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  try {
    const branchFilter = getBranchFilter(session, branchId)

    // 1. Fetch Sales Transactions in Period (Exclude CANCELLED)
    const rawTransactions = await prisma.transaction.findMany({
      where: {
        ...branchFilter,
        transactionDate: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'PENDING_PAYMENT', 'PENDING_CORPORATE'] },
      },
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        customer: {
          select: {
            name: true,
            plateNumber: true,
            corporateCustomer: { select: { id: true, name: true } },
          },
        },
        payments: {
          select: {
            paymentMethod: true,
            amount: true,
            notes: true,
          },
        },
        items: {
          include: {
            sparepart: {
              select: {
                id: true,
                name: true,
                sku: true,
                buyPrice: true,
                sellPrice: true,
                sparepartBrand: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    })

    // 2. Fetch Restocks (PO / Kulakan Modal Keluar) in Period
    const rawRestocks = await prisma.restock.findMany({
      where: {
        ...branchFilter,
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

    // 3. Fetch Corporate Payments in Period
    const rawCorpPayments = await prisma.corporatePayment.findMany({
      where: {
        ...branchFilter,
        paidAt: { gte: startDate, lte: endDate },
        voidedAt: null,
      },
      include: {
        corporateCustomer: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { paidAt: 'desc' },
    })

    // Aggregations
    let serviceRevenue = 0
    let sparepartRevenue = 0
    let totalDiscount = 0
    let cogsSparepart = 0

    let cashInflow = 0
    let transferInflow = 0
    let qrisInflow = 0

    let regularReceivable = 0
    let corporateReceivable = 0

    // Sparepart item profitability map: sparepartId -> stats
    const spProfitMap: Record<
      string,
      {
        id: string
        name: string
        sku: string | null
        brand: string | null
        soldQty: number
        totalRevenue: number
        totalHpp: number
        totalProfit: number
        buyPrices: number[]
        sellPrices: number[]
      }
    > = {}

    const transactions = rawTransactions.map((tx) => {
      let txServiceRev = 0
      let txSparepartRev = 0
      let txSparepartHpp = 0

      const processedItems = tx.items.map((item) => {
        let itemBuyPrice = 0
        let itemHpp = 0
        let itemProfit = item.subtotal

        if (item.itemType === 'SERVICE') {
          txServiceRev += item.subtotal
        } else if (item.itemType === 'SPAREPART') {
          txSparepartRev += item.subtotal
          itemBuyPrice = item.buyPrice ?? (item.sparepart?.buyPrice || 0)
          itemHpp = item.quantity * itemBuyPrice
          itemProfit = item.subtotal - itemHpp
          txSparepartHpp += itemHpp

          const spKey = item.sparepart ? item.sparepart.id : `MANUAL_${item.itemName}`
          const spName = item.sparepart ? item.sparepart.name : `[Luar] ${item.itemName}`
          const spSku = item.sparepart?.sku || 'LUAR'
          const spBrand = item.sparepart?.sparepartBrand || 'Luar Bengkel'

          if (!spProfitMap[spKey]) {
            spProfitMap[spKey] = {
              id: spKey,
              name: spName,
              sku: spSku,
              brand: spBrand,
              soldQty: 0,
              totalRevenue: 0,
              totalHpp: 0,
              totalProfit: 0,
              buyPrices: [],
              sellPrices: [],
            }
          }
          spProfitMap[spKey].soldQty += item.quantity
          spProfitMap[spKey].totalRevenue += item.subtotal
          spProfitMap[spKey].totalHpp += itemHpp
          spProfitMap[spKey].totalProfit += itemProfit
          spProfitMap[spKey].buyPrices.push(itemBuyPrice)
          spProfitMap[spKey].sellPrices.push(item.unitPrice)
        }

        return {
          id: item.id,
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          buyPrice: itemBuyPrice,
          hppSubtotal: itemHpp,
          profit: itemProfit,
        }
      })

      serviceRevenue += txServiceRev
      sparepartRevenue += txSparepartRev
      totalDiscount += tx.discount
      cogsSparepart += txSparepartHpp

      // Calculate Cash Inflows
      if (tx.status === 'PENDING_CORPORATE') {
        corporateReceivable += Math.max(0, tx.total - (tx.paidAmount || 0))
      } else if (tx.status === 'PENDING_PAYMENT') {
        const remaining = Math.max(0, tx.total - (tx.paidAmount || 0))
        regularReceivable += remaining
        if (tx.payments && tx.payments.length > 0) {
          tx.payments.forEach((p) => {
            if (p.paymentMethod === 'CASH') cashInflow += p.amount
            else if (p.paymentMethod === 'TRANSFER') transferInflow += p.amount
            else if (p.paymentMethod === 'QRIS') qrisInflow += p.amount
          })
        }
      } else {
        // COMPLETED
        if (tx.payments && tx.payments.length > 0) {
          tx.payments.forEach((p) => {
            if (p.paymentMethod === 'CASH') cashInflow += p.amount
            else if (p.paymentMethod === 'TRANSFER') transferInflow += p.amount
            else if (p.paymentMethod === 'QRIS') qrisInflow += p.amount
          })
        } else {
          if (tx.paymentMethod === 'CASH') cashInflow += tx.total
          else if (tx.paymentMethod === 'TRANSFER') transferInflow += tx.total
          else if (tx.paymentMethod === 'QRIS') qrisInflow += tx.total
        }
      }

      const txGrossProfit = (txServiceRev + txSparepartRev - tx.discount) - txSparepartHpp
      const txGrossMarginPercent = tx.total > 0 ? (txGrossProfit / tx.total) * 100 : 0

      return {
        id: tx.id,
        invoiceNumber: tx.invoiceNumber,
        transactionDate: tx.transactionDate,
        createdAt: tx.createdAt,
        type: tx.type,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        subtotal: tx.subtotal,
        discount: tx.discount,
        total: tx.total,
        paidAmount: tx.paidAmount,
        changeAmount: tx.changeAmount,
        branchName: tx.branch.name,
        cashierName: tx.user.name,
        customerName: tx.customer?.name || 'Pelanggan Umum',
        plateNumber: tx.customer?.plateNumber || null,
        corporateName: tx.customer?.corporateCustomer?.name || null,
        serviceRevenue: txServiceRev,
        sparepartRevenue: txSparepartRev,
        sparepartHpp: txSparepartHpp,
        grossProfit: txGrossProfit,
        grossMarginPercent: txGrossMarginPercent,
        items: processedItems,
        payments: tx.payments,
      }
    })

    // Restock aggregates
    let totalRestock = 0
    let restockPaid = 0
    let restockUnpaid = 0

    const restocks = rawRestocks.map((r) => {
      totalRestock += r.total
      restockPaid += r.paidAmount
      const unpaid = Math.max(0, r.total - r.paidAmount)
      restockUnpaid += unpaid

      return {
        id: r.id,
        supplierName: r.supplierName,
        date: r.date,
        total: r.total,
        paidAmount: r.paidAmount,
        paymentStatus: r.paymentStatus,
        notes: r.notes,
        branchName: r.branch.name,
        userName: r.user.name,
        itemCount: r.items.length,
      }
    })

    // Corporate payment aggregates
    let corporatePaymentsInflow = 0
    const corporatePayments = rawCorpPayments.map((cp) => {
      corporatePaymentsInflow += cp.amount
      if (cp.paymentMethod === 'CASH') cashInflow += cp.amount
      else if (cp.paymentMethod === 'TRANSFER') transferInflow += cp.amount
      else if (cp.paymentMethod === 'QRIS') qrisInflow += cp.amount

      return {
        id: cp.id,
        amount: cp.amount,
        paymentMethod: cp.paymentMethod,
        paidAt: cp.paidAt,
        notes: cp.notes,
        companyName: cp.corporateCustomer.name,
        branchName: cp.branch.name,
      }
    })

    // Final P&L Computations
    const grossRevenue = serviceRevenue + sparepartRevenue
    const netRevenue = Math.max(0, grossRevenue - totalDiscount)
    const grossProfit = netRevenue - cogsSparepart
    const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

    const serviceProfit = serviceRevenue
    const sparepartProfit = sparepartRevenue - cogsSparepart
    const sparepartMarginPercent = sparepartRevenue > 0 ? (sparepartProfit / sparepartRevenue) * 100 : 0

    const totalCashInflow = cashInflow + transferInflow + qrisInflow
    const netCashFlow = totalCashInflow - restockPaid
    const totalReceivable = regularReceivable + corporateReceivable

    // Sparepart Profitability list
    const sparepartProfitability = Object.values(spProfitMap)
      .map((sp) => {
        const avgBuy = sp.buyPrices.length > 0 ? sp.buyPrices.reduce((a, b) => a + b, 0) / sp.buyPrices.length : 0
        const avgSell = sp.sellPrices.length > 0 ? sp.sellPrices.reduce((a, b) => a + b, 0) / sp.sellPrices.length : 0
        const marginPercent = sp.totalRevenue > 0 ? (sp.totalProfit / sp.totalRevenue) * 100 : 0
        return {
          id: sp.id,
          name: sp.name,
          sku: sp.sku,
          brand: sp.brand,
          soldQty: sp.soldQty,
          avgBuyPrice: avgBuy,
          avgSellPrice: avgSell,
          totalRevenue: sp.totalRevenue,
          totalHpp: sp.totalHpp,
          totalProfit: sp.totalProfit,
          marginPercent,
        }
      })
      .sort((a, b) => b.totalProfit - a.totalProfit)

    return {
      transactions,
      sparepartProfitability,
      restocks,
      corporatePayments,
      summary: {
        serviceRevenue,
        sparepartRevenue,
        grossRevenue,
        discount: totalDiscount,
        netRevenue,
        cogsSparepart,
        grossProfit,
        grossMarginPercent,
        serviceProfit,
        sparepartProfit,
        sparepartMarginPercent,
        cashInflow,
        transferInflow,
        qrisInflow,
        corporatePaymentsInflow,
        totalCashInflow,
        totalRestock,
        restockPaid,
        restockUnpaid,
        netCashFlow,
        regularReceivable,
        corporateReceivable,
        totalReceivable,
        totalTransactions: rawTransactions.length,
        totalRestockCount: rawRestocks.length,
      },
    }
  } catch (error) {
    console.error('getProfitLossReportData error:', error)
    return {
      transactions: [],
      sparepartProfitability: [],
      restocks: [],
      corporatePayments: [],
      summary: {
        serviceRevenue: 0,
        sparepartRevenue: 0,
        grossRevenue: 0,
        discount: 0,
        netRevenue: 0,
        cogsSparepart: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        serviceProfit: 0,
        sparepartProfit: 0,
        sparepartMarginPercent: 0,
        cashInflow: 0,
        transferInflow: 0,
        qrisInflow: 0,
        corporatePaymentsInflow: 0,
        totalCashInflow: 0,
        totalRestock: 0,
        restockPaid: 0,
        restockUnpaid: 0,
        netCashFlow: 0,
        regularReceivable: 0,
        corporateReceivable: 0,
        totalReceivable: 0,
        totalTransactions: 0,
        totalRestockCount: 0,
      },
    }
  }
}


