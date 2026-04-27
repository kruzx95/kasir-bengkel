'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionItemSchema = z.object({
  itemType: z.enum(['SERVICE', 'SPAREPART']),
  itemId: z.string(), // ID of Service or Sparepart
  itemName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
})

const transactionSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(transactionItemSchema).min(1, 'Pilih minimal satu item'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'QRIS']).default('CASH'),
  notes: z.string().optional().nullable(),
})

export type TransactionPayload = z.infer<typeof transactionSchema>

export type TransactionState = {
  success?: boolean
  message?: string
  errors?: any
  invoiceNumber?: string
}

export async function createTransaction(payload: TransactionPayload): Promise<TransactionState> {
  try {
    const session = await getSession()
    if (!session || !session.branchId) {
      return { success: false, message: 'Unauthorized' }
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
    const branchId = session.branchId
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
          invoiceNumber,
          type,
          subtotal,
          discount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          transactionDate: new Date(),
          items: {
            create: data.items.map((item) => ({
              itemType: item.itemType,
              serviceId: item.itemType === 'SERVICE' ? item.itemId : null,
              sparepartId: item.itemType === 'SPAREPART' ? item.itemId : null,
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
        if (item.itemType === 'SPAREPART') {
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

      return transaction
    })

    revalidatePath('/kasir/transaksi')
    revalidatePath('/kasir/sparepart')
    return { success: true, message: 'Transaksi berhasil disimpan', invoiceNumber: result.invoiceNumber }
  } catch (error: any) {
    console.error('Create Transaction Error:', error)
    return { success: false, message: error.message || 'Terjadi kesalahan pada server' }
  }
}

export async function getTransactions(branchId?: string, dateStr?: string) {
  try {
    const session = await getSession()
    if (!session) return []

    // If kasir, force branchId
    const targetBranch = session.role === 'KASIR' ? session.branchId : branchId

    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(targetBranch ? { branchId: targetBranch } : {}),
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customer: {
          select: { name: true, plateNumber: true }
        },
        user: {
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

export async function getTransactionDetails(id: string) {
  try {
    const session = await getSession()
    if (!session) return null

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        subtotal: true,
        discount: true,
        total: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        customer: {
          select: { id: true, name: true, phone: true, plateNumber: true, vehicleType: true }
        },
        user: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true, address: true, phone: true }
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
    if (transaction && session.role === 'KASIR' && transaction.branch.id !== session.branchId) {
      return null
    }

    return transaction
  } catch (error) {
    console.error('Get Transaction Details Error:', error)
    return null
  }
}
