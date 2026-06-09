'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const restockItemSchema = z.object({
  sparepartId: z.string().optional().nullable(),
  isNew: z.boolean().optional(),
  name: z.string().optional(),
  sku: z.string().optional().nullable(),
  quantity: z.number().min(1),
  buyPrice: z.number().min(0),
  sellPrice: z.number().optional(),
})

const restockSchema = z.object({
  branchId: z.string(),
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  date: z.string(), // ISO date string
  notes: z.string().optional().nullable(),
  receiptImagePath: z.string().optional().nullable(),
  paidAmount: z.number().min(0).optional(),
  items: z.array(restockItemSchema).min(1, 'Pilih minimal satu sparepart'),
})

export type RestockPayload = z.infer<typeof restockSchema>

export async function createRestock(payload: RestockPayload) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    const validated = restockSchema.safeParse(payload)
    if (!validated.success) {
      return { success: false, message: 'Validasi form gagal' }
    }

    const data = validated.data

    await prisma.$transaction(async (tx) => {
      const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
      const targetBranchId = isSuperAdmin ? data.branchId : session.branchId!

      let total = 0
      
      // Process items: create new spareparts if needed
      const restockItemsData = await Promise.all(data.items.map(async (item) => {
        let actualSparepartId = item.sparepartId

        if (item.isNew && item.name) {
          const newSp = await tx.sparepart.create({
            data: {
              branchId: targetBranchId,
              name: item.name,
              sku: item.sku || null,
              buyPrice: item.buyPrice,
              sellPrice: item.sellPrice || item.buyPrice,
              stock: 0, // will be incremented below
            }
          })
          actualSparepartId = newSp.id
        }

        if (!actualSparepartId) throw new Error('Missing sparepartId')

        const subtotal = item.quantity * item.buyPrice
        total += subtotal
        
        return {
          sparepartId: actualSparepartId,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          subtotal
        }
      }))

      const paidAmount = data.paidAmount || 0
      const paymentStatus = paidAmount >= total ? 'LUNAS' : 'HUTANG'

      const restock = await tx.restock.create({
        data: {
          branchId: targetBranchId,
          userId: session.userId,
          supplierName: data.supplierName,
          date: new Date(data.date),
          notes: data.notes,
          receiptImagePath: data.receiptImagePath || null,
          total,
          paidAmount,
          paymentStatus,
          items: {
            create: restockItemsData
          }
        }
      })

      // Update Stock and Buy Price
      for (const itemData of restockItemsData) {
        await tx.sparepart.update({
          where: { id: itemData.sparepartId },
          data: {
            stock: { increment: itemData.quantity },
            buyPrice: itemData.buyPrice
          }
        })
      }

      return restock
    })

    revalidatePath('/admin/restock')
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Barang masuk berhasil dicatat' }
  } catch (error) {
    console.error('Create Restock Error:', error)
    return { success: false, message: 'Gagal menyimpan barang masuk' }
  }
}

export async function getRestocks(branchId?: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return []

    return await prisma.restock.findMany({
      where: getBranchFilter(session, branchId),
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        items: { select: { quantity: true } }
      },
      orderBy: { date: 'desc' }
    })
  } catch {
    return []
  }
  
}

export async function getRestockDetails(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return null

    return await prisma.restock.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true, address: true } },
        user: { select: { name: true } },
        items: {
          include: {
            sparepart: { select: { name: true, sku: true } }
          }
        }
      }
    })
  } catch {
    return null
  }
}
