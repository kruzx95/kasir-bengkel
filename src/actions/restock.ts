'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const restockItemSchema = z.object({
  sparepartId: z.string(),
  quantity: z.number().min(1),
  buyPrice: z.number().min(0),
})

const restockSchema = z.object({
  branchId: z.string(),
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  date: z.string(), // ISO date string
  notes: z.string().optional().nullable(),
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

    const result = await prisma.$transaction(async (tx) => {
      let total = 0
      const restockItems = data.items.map(item => {
        const subtotal = item.quantity * item.buyPrice
        total += subtotal
        return {
          sparepartId: item.sparepartId,
          quantity: item.quantity,
          buyPrice: item.buyPrice,
          subtotal
        }
      })

      const restock = await tx.restock.create({
        data: {
          branchId: data.branchId,
          userId: session.userId,
          supplierName: data.supplierName,
          date: new Date(data.date),
          notes: data.notes,
          total,
          items: {
            create: restockItems
          }
        }
      })

      // Update Stock and Buy Price
      for (const item of data.items) {
        await tx.sparepart.update({
          where: { id: item.sparepartId },
          data: {
            stock: { increment: item.quantity },
            buyPrice: item.buyPrice // Update with the latest buy price
          }
        })
      }

      return restock
    })

    revalidatePath('/admin/restock')
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Barang masuk berhasil dicatat' }
  } catch (error: any) {
    console.error('Create Restock Error:', error)
    return { success: false, message: error.message || 'Gagal menyimpan barang masuk' }
  }
}

export async function getRestocks(branchId?: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return []

    return await prisma.restock.findMany({
      where: branchId ? { branchId } : {},
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        items: { select: { quantity: true } }
      },
      orderBy: { date: 'desc' }
    })
  } catch (error) {
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
  } catch (error) {
    return null
  }
}
