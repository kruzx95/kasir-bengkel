'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const stockTransferSchema = z.object({
  sparepartId: z.string().min(1, 'Sparepart harus dipilih'),
  quantity: z.number().int().min(1, 'Jumlah minimal 1'),
  type: z.enum(['WAREHOUSE_TO_STORE', 'STORE_TO_WAREHOUSE']),
  notes: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
})

const bulkTransferSchema = z.object({
  items: z.array(z.object({
    sparepartId: z.string(),
    quantity: z.number().int().min(1)
  })).min(1, 'Minimal 1 item'),
  branchId: z.string().optional().nullable(),
})

export type StockTransferPayload = z.infer<typeof stockTransferSchema>
export type BulkTransferPayload = z.infer<typeof bulkTransferSchema>

export type StockTransferState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
}

export async function createStockTransfer(payload: StockTransferPayload): Promise<StockTransferState> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Hanya admin yang bisa transfer stock.' }
    }

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    if (isSuperAdmin && !payload.branchId) {
      return { success: false, message: 'Admin harus memilih cabang untuk transfer.' }
    }

    const validated = stockTransferSchema.safeParse(payload)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validasi form gagal',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const data = validated.data
    const branchId = isSuperAdmin ? payload.branchId! : session.branchId!

    await prisma.$transaction(async (tx) => {
      // Get current stock
      const sparepart = await tx.sparepart.findUnique({
        where: { id: data.sparepartId },
        select: { 
          id: true, 
          name: true, 
          stock: true, 
          warehouseStock: true,
          branchId: true
        }
      })

      if (!sparepart) {
        throw new Error('Sparepart tidak ditemukan')
      }

      // Validate branch (only transfer within same branch)
      if (sparepart.branchId !== branchId) {
        throw new Error('Sparepart tidak ditemukan di cabang yang dipilih')
      }

      if (data.type === 'WAREHOUSE_TO_STORE') {
        // Transfer: Gudang → Toko
        if (sparepart.warehouseStock < data.quantity) {
          throw new Error(`Stock gudang tidak mencukupi. Stock gudang: ${sparepart.warehouseStock}, diminta: ${data.quantity}`)
        }

        await tx.sparepart.update({
          where: { id: data.sparepartId },
          data: {
            warehouseStock: { decrement: data.quantity },
            stock: { increment: data.quantity }
          }
        })
      } else {
        // Retur: Toko → Gudang
        if (sparepart.stock < data.quantity) {
          throw new Error(`Stock toko tidak mencukupi. Stock toko: ${sparepart.stock}, diminta: ${data.quantity}`)
        }

        await tx.sparepart.update({
          where: { id: data.sparepartId },
          data: {
            stock: { decrement: data.quantity },
            warehouseStock: { increment: data.quantity }
          }
        })
      }

      // Record transfer
      await tx.stockTransfer.create({
        data: {
          branchId,
          userId: session.userId,
          sparepartId: data.sparepartId,
          type: data.type,
          quantity: data.quantity,
          notes: data.notes || null
        }
      })
    })

    revalidatePath('/admin/stock-transfer')
    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')

    const action = data.type === 'WAREHOUSE_TO_STORE' ? 'dari gudang ke toko' : 'dari toko ke gudang'
    return { success: true, message: `Berhasil transfer ${data.quantity} unit ${action}` }
  } catch (error: unknown) {
    console.error('Create Stock Transfer Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal melakukan transfer stock'
    return { success: false, message }
  }
}

export async function bulkTransferToStore(payload: BulkTransferPayload): Promise<StockTransferState> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' }
    }

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    if (isSuperAdmin && !payload.branchId) {
      return { success: false, message: 'Admin harus memilih cabang' }
    }

    const validated = bulkTransferSchema.safeParse(payload)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validasi form gagal',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const data = validated.data
    const branchId = isSuperAdmin ? payload.branchId! : session.branchId!

    let successCount = 0
    const errors: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        try {
          const sparepart = await tx.sparepart.findUnique({
            where: { id: item.sparepartId },
            select: { 
              name: true, 
              warehouseStock: true,
              branchId: true
            }
          })

          if (!sparepart || sparepart.branchId !== branchId) {
            errors.push(`${sparepart?.name || 'Unknown'}: Tidak ditemukan di cabang ini`)
            continue
          }

          if (sparepart.warehouseStock < item.quantity) {
            errors.push(`${sparepart.name}: Stock gudang tidak mencukupi (${sparepart.warehouseStock} < ${item.quantity})`)
            continue
          }

          await tx.sparepart.update({
            where: { id: item.sparepartId },
            data: {
              warehouseStock: { decrement: item.quantity },
              stock: { increment: item.quantity }
            }
          })

          await tx.stockTransfer.create({
            data: {
              branchId,
              userId: session.userId,
              sparepartId: item.sparepartId,
              type: 'WAREHOUSE_TO_STORE',
              quantity: item.quantity,
              notes: 'Bulk transfer'
            }
          })

          successCount++
        } catch (error) {
          console.error(`Error transferring item ${item.sparepartId}:`, error)
          errors.push(`Item error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    })

    revalidatePath('/admin/stock-transfer')
    revalidatePath('/admin/master/spareparts')

    if (successCount === 0) {
      return { 
        success: false, 
        message: `Gagal transfer semua item. Errors: ${errors.join(', ')}` 
      }
    }

    if (errors.length > 0) {
      return { 
        success: true, 
        message: `Berhasil transfer ${successCount} item. ${errors.length} gagal: ${errors.join(', ')}` 
      }
    }

    return { 
      success: true, 
      message: `Berhasil transfer ${successCount} item dari gudang ke toko` 
    }
  } catch (error: unknown) {
    console.error('Bulk Transfer Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal melakukan bulk transfer'
    return { success: false, message }
  }
}

export async function getStockTransfers(branchId?: string, dateStr?: string) {
  try {
    const session = await getSession()
    if (!session) return []

    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const transfers = await prisma.stockTransfer.findMany({
      where: {
        ...getBranchFilter(session, branchId),
        transferDate: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        notes: true,
        transferDate: true,
        sparepart: {
          select: {
            name: true,
            unit: true
          }
        },
        user: {
          select: {
            name: true
          }
        },
        branch: {
          select: {
            name: true
          }
        }
      },
      orderBy: { transferDate: 'desc' }
    })

    return transfers
  } catch (error) {
    console.error('Get Stock Transfers Error:', error)
    return []
  }
}

export async function getStockTransferHistory(sparepartId: string) {
  try {
    const session = await getSession()
    if (!session) return []

    const history = await prisma.stockTransfer.findMany({
      where: { sparepartId },
      select: {
        id: true,
        type: true,
        quantity: true,
        notes: true,
        transferDate: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { transferDate: 'desc' },
      take: 50
    })

    return history
  } catch (error) {
    console.error('Get Stock Transfer History Error:', error)
    return []
  }
}

export async function getWarehouseStats(branchId?: string) {
  try {
    const session = await getSession()
    if (!session) return null

    const where = getBranchFilter(session, branchId)

    const [spareparts, todayTransfers] = await Promise.all([
      prisma.sparepart.findMany({
        where: {
          ...where,
          isActive: true
        },
        select: {
          warehouseStock: true,
          minWarehouseStock: true,
          stock: true,
          minStock: true
        }
      }),
      prisma.stockTransfer.count({
        where: {
          ...where,
          transferDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    const totalWarehouseUnits = spareparts.reduce((sum, sp) => sum + sp.warehouseStock, 0)
    const totalStoreUnits = spareparts.reduce((sum, sp) => sum + sp.stock, 0)
    const lowWarehouseStock = spareparts.filter(sp => sp.warehouseStock < sp.minWarehouseStock).length
    const lowStoreStock = spareparts.filter(sp => sp.stock < sp.minStock).length

    return {
      totalItems: spareparts.length,
      totalWarehouseUnits,
      totalStoreUnits,
      lowWarehouseStock,
      lowStoreStock,
      todayTransfers
    }
  } catch (error) {
    console.error('Get Warehouse Stats Error:', error)
    return null
  }
}