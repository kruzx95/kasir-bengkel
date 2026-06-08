'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type IndentOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED'

const indentItemSchema = z.object({
  sparepartId: z.string(),
  quantity: z.number().min(1),
  estimatedPrice: z.number().min(0),
})

const indentSchema = z.object({
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  orderDate: z.string(),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(indentItemSchema).min(1, 'Pilih minimal satu sparepart'),
})

export type IndentPayload = z.infer<typeof indentSchema>

export async function createIndentOrder(payload: IndentPayload) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    const validated = indentSchema.safeParse(payload)
    if (!validated.success) {
      return { success: false, message: 'Validasi form gagal' }
    }

    const data = validated.data

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    const targetBranchId = isSuperAdmin ? data.branchId : session.branchId!

    await prisma.indentOrder.create({
      data: {
        branchId: targetBranchId,
        userId: session.userId,
        supplierName: data.supplierName,
        orderDate: new Date(data.orderDate),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes,
        status: 'PENDING',
        items: {
          create: data.items.map((item) => ({
            sparepartId: item.sparepartId,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
            receivedQty: 0,
          })),
        },
      },
    })

    revalidatePath('/admin/indent')
    return { success: true, message: 'Pesanan indent berhasil disimpan' }
  } catch (error: unknown) {
    console.error('Create Indent Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal menyimpan indent'
    return { success: false, message }
  }
}

export async function getIndentOrders(branchId?: string, status?: IndentOrderStatus) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return []

    return await prisma.indentOrder.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        ...(status ? { status } : {}),
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
      orderBy: { orderDate: 'desc' },
    })
  } catch {
    return []
  }
}

export async function getIndentOrderById(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return null

    return await prisma.indentOrder.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        user: { select: { name: true } },
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
    if (!session || session.role !== 'ADMIN') {
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
            stock: { increment: receivedItem.receivedQty },
            buyPrice: receivedItem.actualPrice,
          },
        })
      }

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
    revalidatePath('/admin/restock')
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Penerimaan barang berhasil dicatat' }
  } catch (error) {
    console.error('Receive Indent Error:', error)
    return { success: false, message: 'Gagal mencatat penerimaan barang' }
  }
}
