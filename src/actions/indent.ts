'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type IndentOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED'

const indentItemSchema = z.object({
  sparepartId: z.string().nullable().optional(),
  isManual: z.boolean().optional(),
  name: z.string().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().min(1),
  estimatedPrice: z.number().min(0),
})

const indentSchema = z.object({
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  orderDate: z.string(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  dpAmount: z.number().min(0).optional(),
  type: z.enum(['RESTOCK', 'CUSTOMER']).default('CUSTOMER'),
  customerId: z.string().optional().nullable(),
  items: z.array(indentItemSchema).min(1, 'Pilih minimal satu sparepart'),
})

export type IndentPayload = z.infer<typeof indentSchema>

export async function createIndentOrder(payload: IndentPayload) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: 'Unauthorized' }
    }

    const validated = indentSchema.safeParse(payload)
    if (!validated.success) {
      return { success: false, message: 'Validasi form gagal' }
    }

    const data = validated.data

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    const targetBranchId = isSuperAdmin ? data.branchId : session.branchId!

    // For manual items, create the sparepart first
    const processedItems = []
    for (const item of data.items) {
      if (item.isManual && !item.sparepartId) {
        // Create new sparepart for manual item
        const newSparepart = await prisma.sparepart.create({
          data: {
            name: item.name || 'Barang Baru',
            sku: item.sku || null,
            branchId: targetBranchId,
            stock: 0,
            buyPrice: item.estimatedPrice,
            sellPrice: 0,
            unit: 'PCS',
          },
        })
        processedItems.push({
          sparepartId: newSparepart.id,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
          receivedQty: 0,
        })
      } else {
        processedItems.push({
          sparepartId: item.sparepartId!,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
          receivedQty: 0,
        })
      }
    }

    await prisma.indentOrder.create({
      data: {
        branchId: targetBranchId,
        userId: session.userId,
        supplierName: data.supplierName,
        orderDate: new Date(data.orderDate),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes,
        dpAmount: data.dpAmount || 0,
        type: data.type,
        customerId: data.customerId || null,
        status: 'PENDING',
        items: {
          create: processedItems,
        },
      },
    })

    revalidatePath('/admin/indent')
    revalidatePath('/kasir/indent')
    revalidatePath('/admin/restock')
    revalidatePath('/kasir/restock')
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Pesanan indent berhasil disimpan' }
  } catch (error: unknown) {
    console.error('Create Indent Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal menyimpan indent'
    return { success: false, message }
  }
}

export async function getPaginatedIndentOrders(
  page = 1,
  limit = 20,
  branchId?: string | null,
  type: 'RESTOCK' | 'CUSTOMER' = 'CUSTOMER'
) {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: page }

    const where = {
      ...getBranchFilter(session, branchId),
      type,
    }

    const [data, totalCount] = await Promise.all([
      prisma.indentOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: true,
          customer: { select: { name: true, phone: true } },
          items: {
            include: { sparepart: true },
          },
        },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.indentOrder.count({ where }),
    ])

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  } catch {
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
}

export async function getIndentOrders(
  branchId?: string,
  status?: IndentOrderStatus,
  type: 'RESTOCK' | 'CUSTOMER' = 'CUSTOMER'
) {
  try {
    const session = await getSession()
    if (!session) return []

    return await prisma.indentOrder.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        type,
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
  } catch {
    return []
  }
}

export async function getIndentOrderById(id: string) {
  try {
    const session = await getSession()
    if (!session) return null

    return await prisma.indentOrder.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            sparepart: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
    })
  } catch {
    return null
  }
}

const receiveItemSchema = z.object({
  indentOrderItemId: z.string(),
  sparepartId: z.string(),
  receivedQty: z.number().min(0),
  actualPrice: z.number().min(0),
})

const receiveSchema = z.object({
  indentOrderId: z.string(),
  supplierName: z.string(),
  date: z.string(),
  notes: z.string().optional().nullable(),
  receiptImagePath: z.string().optional().nullable(),
  items: z.array(receiveItemSchema).min(1),
})

export type ReceiveIndentPayload = z.infer<typeof receiveSchema>

export async function receiveIndentOrder(payload: ReceiveIndentPayload) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: 'Unauthorized' }
    }

    const validated = receiveSchema.safeParse(payload)
    if (!validated.success) {
      return { success: false, message: 'Validasi form gagal' }
    }

    const data = validated.data

    await prisma.$transaction(async (tx) => {
      // Get indent order
      const indentOrder = await tx.indentOrder.findUnique({
        where: { id: data.indentOrderId },
        include: { items: true, branch: true },
      })

      if (!indentOrder) throw new Error('Pesanan indent tidak ditemukan')
      if (indentOrder.status === 'RECEIVED') throw new Error('Pesanan ini sudah diterima sepenuhnya')

      // Calculate restock total & update received quantities
      let total = 0
      const restockItems = []

      for (const receivedItem of data.items) {
        if (receivedItem.receivedQty <= 0) continue

        const subtotal = receivedItem.receivedQty * receivedItem.actualPrice
        total += subtotal

        restockItems.push({
          sparepartId: receivedItem.sparepartId,
          quantity: receivedItem.receivedQty,
          buyPrice: receivedItem.actualPrice,
          subtotal,
        })

        // Update received qty on indent item
        await tx.indentOrderItem.update({
          where: { id: receivedItem.indentOrderItemId },
          data: { receivedQty: { increment: receivedItem.receivedQty } },
        })

        // Update sparepart stock & buy price
        await tx.sparepart.update({
          where: { id: receivedItem.sparepartId },
          data: {
            warehouseStock: { increment: receivedItem.receivedQty },
            buyPrice: receivedItem.actualPrice,
          },
        })
      }

      const paymentStatus = indentOrder.dpAmount >= total ? 'LUNAS' : 'HUTANG'

      // Create restock record linked to indent
      const restock = await tx.restock.create({
        data: {
          branchId: indentOrder.branchId,
          userId: session.userId,
          supplierName: data.supplierName,
          date: new Date(data.date),
          notes: data.notes,
          receiptImagePath: data.receiptImagePath || null,
          total,
          paidAmount: indentOrder.dpAmount,
          paymentStatus,
          indentOrderId: data.indentOrderId,
          items: { create: restockItems },
        },
      })

      // Determine new indent status
      const updatedItems = await tx.indentOrderItem.findMany({
        where: { indentOrderId: data.indentOrderId },
      })

      const allReceived = updatedItems.every((i) => i.receivedQty >= i.quantity)
      const anyReceived = updatedItems.some((i) => i.receivedQty > 0)

      const newStatus: IndentOrderStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : 'PENDING'

      await tx.indentOrder.update({
        where: { id: data.indentOrderId },
        data: { status: newStatus },
      })

      return restock
    })

    revalidatePath('/admin/indent')
    revalidatePath('/kasir/indent')
    revalidatePath('/admin/restock')
    revalidatePath('/kasir/restock')
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Penerimaan barang berhasil dicatat' }
  } catch (error) {
    console.error('Receive Indent Error:', error)
    return { success: false, message: 'Gagal mencatat penerimaan barang' }
  }
}
