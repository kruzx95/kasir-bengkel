'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionItemSchema = z.object({
  itemType: z.enum(['SERVICE', 'SPAREPART']),
  itemId: z.string().nullable().optional(), // ID of Service or Sparepart, null for manual
  itemName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
})

const transactionSchema = z.object({
  customerId: z.string().optional().nullable(),
  mechanicId: z.string().optional().nullable(),
  items: z.array(transactionItemSchema).min(1, 'Pilih minimal satu item'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'QRIS']).default('CASH'),
  notes: z.string().optional().nullable(),
  isCorporate: z.boolean().optional().default(false),
  odometer: z.number().int().min(0).optional().nullable(),
  branchId: z.string().optional().nullable(),
})

export type TransactionPayload = z.infer<typeof transactionSchema>

export type TransactionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
  invoiceNumber?: string
}

export async function createTransaction(payload: TransactionPayload): Promise<TransactionState> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: 'Unauthorized' }
    }

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    if (isSuperAdmin && !payload.branchId) {
      return { success: false, message: 'Admin harus memilih cabang untuk transaksi.' }
    }

    // Validate against DB to prevent stale session branchId
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { branchId: true, isActive: true }
    })

    if (!dbUser || !dbUser.isActive) {
      return { success: false, message: 'User tidak ditemukan atau tidak aktif. Silakan login ulang.' }
    }

    // For non-super-admin, session branchId must match DB
    if (!isSuperAdmin && session.branchId !== dbUser.branchId) {
      return { success: false, message: 'Data cabang tidak sinkron. Silakan logout dan login ulang.' }
    }

    const validated = transactionSchema.safeParse(payload)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validasi form gagal. Periksa kembali input Anda.',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const data = validated.data
    const branchId = isSuperAdmin ? payload.branchId! : dbUser.branchId!
    const userId = session.userId

    // Begin Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate Subtotal & Determine Transaction Type
      let subtotal = 0
      let hasService = false
      let hasSparepart = false

      for (const item of data.items) {
        subtotal += item.quantity * item.unitPrice
        if (item.itemType === 'SERVICE') hasService = true
        if (item.itemType === 'SPAREPART') hasSparepart = true
      }

      const total = Math.max(0, subtotal - data.discount)

      let type: 'SERVICE' | 'SPAREPART' | 'MIXED' = 'MIXED'
      if (hasService && !hasSparepart) type = 'SERVICE'
      if (!hasService && hasSparepart) type = 'SPAREPART'

      // 2. Generate Invoice Number (Format: INV-BRGCODE-YYYYMMDD-0001)
      const branch = await tx.branch.findUnique({
        where: { id: branchId },
        select: { code: true }
      })
      
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const countToday = await tx.transaction.count({
        where: {
          branchId,
          transactionDate: {
            gte: today,
          }
        }
      })
      
      const sequence = (countToday + 1).toString().padStart(4, '0')
      const invoiceNumber = `INV-${branch?.code}-${dateStr}-${sequence}`

      // 3. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          branchId,
          userId,
          customerId: data.customerId || null,
          mechanicId: data.mechanicId || null,
          invoiceNumber,
          type,
          status: data.isCorporate ? 'PENDING_CORPORATE' : 'COMPLETED',
          subtotal,
          discount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          odometer: data.odometer ?? null,
          transactionDate: new Date(),
          items: {
            create: data.items.map((item) => ({
              itemType: item.itemType,
              serviceId: item.itemType === 'SERVICE' && item.itemId && !item.itemId.startsWith('MANUAL_') ? item.itemId : null,
              sparepartId: item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_') ? item.itemId : null,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            }))
          }
        }
      })

      // 4. Update Sparepart Stock
      for (const item of data.items) {
        if (item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_')) {
          // Verify stock first
          const sp = await tx.sparepart.findUnique({
            where: { id: item.itemId },
            select: { stock: true, name: true }
          })
          
          if (!sp || sp.stock < item.quantity) {
            throw new Error(`Stok sparepart ${sp?.name || 'tidak diketahui'} tidak mencukupi.`)
          }
          
          await tx.sparepart.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } }
          })
        }
      }

      // 5. Update Customer Odometer (jika ada)
      if (data.customerId && data.odometer !== undefined && data.odometer !== null) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { odometer: data.odometer }
        })
      }

      return transaction
    })

    revalidatePath('/kasir/transaksi')
    revalidatePath('/kasir/sparepart')
    revalidatePath('/admin/transaksi')
    return { success: true, message: 'Transaksi berhasil disimpan', invoiceNumber: result.invoiceNumber }
  } catch (error: unknown) {
    console.error('Create Transaction Error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server'
    return { success: false, message }
  }
}

export async function getTransactions(branchId?: string, dateStr?: string) {
  try {
    const session = await getSession()
    if (!session) return []

    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customer: {
          select: { name: true, plateNumber: true }
        },
        user: {
          select: { name: true }
        },
        mechanic: {
          select: { name: true }
        },
        branch: {
          select: { name: true }
        },
        items: {
          select: { itemType: true, subtotal: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return transactions
  } catch (error) {
    console.error('Get Transactions Error:', error)
    return []
  }
}

export type PaginatedResult<T> = {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getPaginatedTransactions(
  page = 1,
  limit = 50,
  branchId?: string,
  dateStr?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<PaginatedResult<any>> {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: page }

    const targetDate = dateStr ? new Date(dateStr) : undefined
    let dateFilter = {}
    if (targetDate) {
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)
      dateFilter = {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    }

    const where = {
      ...getBranchFilter(session, branchId),
      ...dateFilter
    }

    const [totalCount, data] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          customer: { select: { name: true, plateNumber: true } },
          user: { select: { name: true } },
          mechanic: { select: { name: true } },
          branch: { select: { name: true } },
          items: { select: { itemType: true, subtotal: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Get Paginated Transactions Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
}

export async function getTransactionDetails(id: string) {
  try {
    const session = await getSession()
    if (!session) return null

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id }
        ]
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        paymentMethod: true,
        notes: true,
        transactionDate: true,
        odometer: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            plateNumber: true,
            vehicleType: true,
            corporateCustomer: {
              select: { id: true, name: true }
            }
          }
        },
        user: {
          select: { id: true, name: true }
        },
        mechanic: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true, address: true, phone: true, instagramHandle: true, facebookPage: true, whatsappNumber: true }
        },
        items: {
          select: {
            id: true,
            itemType: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true
          }
        }
      }
    })

    // Security check: Kasir can only see their own branch's transactions
    if (transaction && session.role === 'KASIR' && transaction.branch?.id !== session.branchId) {
      return null
    }

    // Get odometer history if customer exists
    let odometerHistory: Array<{ date: Date; odometer: number; invoiceNumber: string }> = []
    if (transaction?.customer?.id) {
      const history = await prisma.transaction.findMany({
        where: {
          customerId: transaction.customer.id,
          odometer: { not: null },
          status: { not: 'CANCELLED' },
          id: { not: id }
        },
        select: {
          transactionDate: true,
          odometer: true,
          invoiceNumber: true
        },
        orderBy: { transactionDate: 'desc' },
        take: 5
      })
      
      odometerHistory = history.map(h => ({
        date: h.transactionDate,
        odometer: h.odometer!,
        invoiceNumber: h.invoiceNumber
      }))
    }

    return transaction ? {
      ...transaction,
      odometerHistory
    } : null
  } catch (error) {
    console.error('Get Transaction Details Error:', error)
    return null
  }
}

export async function cancelTransaction(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { success: false, message: 'Unauthorized. Hanya admin yang bisa membatalkan transaksi.' }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!transaction) throw new Error('Transaksi tidak ditemukan')
      if (transaction.status === 'CANCELLED') throw new Error('Transaksi sudah dibatalkan')

      await tx.transaction.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      for (const item of transaction.items) {
        if (item.itemType === 'SPAREPART' && item.sparepartId) {
          await tx.sparepart.update({
            where: { id: item.sparepartId },
            data: { stock: { increment: item.quantity } }
          })
        }
      }
      return transaction
    })

    revalidatePath('/kasir/transaksi')
    revalidatePath('/admin/transaksi')
    revalidatePath('/kasir/sparepart')
    revalidatePath('/admin/master/spareparts')
    
    return { success: true, message: 'Transaksi berhasil dibatalkan dan stok dikembalikan.' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan transaksi.'
    return { success: false, message }
  }
}
