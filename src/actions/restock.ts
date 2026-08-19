'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActivityLog } from '@/lib/logger'

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
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptImagePath: z.string().optional().nullable(),
  paidAmount: z.number().min(0).optional(),
  items: z.array(restockItemSchema).min(1, 'Pilih minimal satu sparepart'),
})

export type RestockPayload = z.infer<typeof restockSchema>

export async function createRestock(payload: RestockPayload) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const validated = restockSchema.safeParse(payload)
    if (!validated.success) {
      return { success: false, message: 'Validasi form gagal' }
    }

    const data = validated.data

    const po = await prisma.$transaction(async (tx) => {
      const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
      const targetBranchId = isSuperAdmin ? data.branchId : session.branchId!

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
              stock: 0,
              // Barang baru dari input manual langsung tercatat di Master Data Stock Gudang
              // dengan qty awal = jumlah yang diinput di PO. Stok ini akan dimindahkan ke
              // toko via menu Stock Transfer (sesuai alur double-stock gudang/toko).
              warehouseStock: item.quantity,
            }
          })
          actualSparepartId = newSp.id
        }

        if (!actualSparepartId) throw new Error(`sparepartId tidak ditemukan untuk item: "${item.name || 'unknown'}". Pastikan item memiliki sparepartId atau flag isNew=true.`)

        return {
          sparepartId: actualSparepartId,
          quantity: item.quantity,
          estimatedPrice: item.buyPrice,
          receivedQty: 0
        }
      }))

      const po = await tx.indentOrder.create({
        data: {
          branchId: targetBranchId,
          userId: session.userId,
          supplierName: data.supplierName,
          orderDate: new Date(data.date),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes,
          dpAmount: data.paidAmount || 0,
          type: 'RESTOCK',
          status: 'PENDING',
          items: {
            create: restockItemsData
          }
        }
      })

      return po
    })

    await createActivityLog({
      action: 'RESTOCK_CREATE',
      category: 'STOCK',
      level: 'INFO',
      description: `Pencatatan restock / PO ke supplier "${data.supplierName}" (${data.items.length} item) oleh ${session.name}`,
      details: {
        poId: po.id,
        supplierName: data.supplierName,
        itemCount: data.items.length,
        dpAmount: data.paidAmount || 0,
      },
      branchId: data.branchId || session.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/restock')
    revalidatePath('/kasir/restock')
    revalidatePath('/admin/master/spareparts')
    revalidatePath('/admin/stock-gudang')
    revalidatePath('/admin/stock-toko')
    return { success: true, id: po.id, message: 'Barang masuk berhasil dicatat. Barang baru akan tampil di Master Data Stock Gudang dengan qty sesuai input PO.' }
  } catch (error) {
    console.error('Create Restock Error:', error)
    return { success: false, message: 'Gagal menyimpan barang masuk' }
  }
}

export async function getRestocks(branchId?: string | null) {
  try {
    const session = await getSession()
    if (!session) return []

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
    if (!session) return null

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
