'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter, isDemoUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActivityLog } from '@/lib/logger'

const stockTransferSchema = z.object({
  sparepartId: z.string().min(1, 'Sparepart harus dipilih'),
  quantity: z.number().int().min(1, 'Jumlah minimal 1'),
  type: z.enum(['WAREHOUSE_TO_STORE', 'STORE_TO_WAREHOUSE']),
  notes: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
})

const bulkTransferSchema = z.object({
  type: z.enum(['WAREHOUSE_TO_STORE', 'STORE_TO_WAREHOUSE']).default('WAREHOUSE_TO_STORE'),
  items: z.array(z.object({
    sparepartId: z.string().min(1, 'Sparepart harus dipilih'),
    quantity: z.number().int().min(1, 'Jumlah minimal 1 unit')
  })).min(1, 'Minimal 1 item yang ditransfer'),
  notes: z.string().optional().nullable(),
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
    if (!session) {
      return { success: false, message: 'Unauthorized.' }
    }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo Aktif: Transfer stok dinonaktifkan (Lihat Saja).' }
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

    const actionText = data.type === 'WAREHOUSE_TO_STORE' ? 'Gudang -> Toko' : 'Toko -> Gudang'
    createActivityLog({
      action: 'STOCK_TRANSFER',
      category: 'STOCK',
      level: 'INFO',
      description: `Transfer stok (${actionText}): ${data.quantity} unit`,
      details: {
        sparepartId: data.sparepartId,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes || null,
      },
      branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/stock-transfer')
    revalidatePath('/kasir/stock-transfer')
    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    revalidatePath('/admin/stock-toko')
    revalidatePath('/kasir/stock-toko')
    revalidatePath('/admin/stock-gudang')
    revalidatePath('/kasir/stock-gudang')

    const action = data.type === 'WAREHOUSE_TO_STORE' ? 'dari gudang ke toko' : 'dari toko ke gudang'
    return { success: true, message: `Berhasil transfer ${data.quantity} unit ${action}` }
  } catch (error: unknown) {
    console.error('Create Stock Transfer Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal melakukan transfer stock'
    return { success: false, message }
  }
}

export async function createBulkStockTransfer(payload: BulkTransferPayload): Promise<StockTransferState> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: 'Unauthorized.' }
    }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo Aktif: Transfer stok massal dinonaktifkan (Lihat Saja).' }
    }

    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    if (isSuperAdmin && !payload.branchId) {
      return { success: false, message: 'Admin harus memilih cabang untuk transfer.' }
    }

    const validated = bulkTransferSchema.safeParse(payload)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validasi form transfer gagal',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const data = validated.data
    const branchId = isSuperAdmin ? payload.branchId! : session.branchId!

    const sparepartIds = data.items.map((i) => i.sparepartId)
    const dbSpareparts = await prisma.sparepart.findMany({
      where: { id: { in: sparepartIds }, branchId },
      select: {
        id: true,
        name: true,
        stock: true,
        warehouseStock: true,
        unit: true,
      },
    })

    const sparepartsMap = new Map(dbSpareparts.map((sp) => [sp.id, sp]))

    // Validate all items before making any modifications
    for (const item of data.items) {
      const sp = sparepartsMap.get(item.sparepartId)
      if (!sp) {
        return { success: false, message: `Sparepart ID ${item.sparepartId} tidak ditemukan di cabang ini.` }
      }

      if (data.type === 'WAREHOUSE_TO_STORE') {
        if (sp.warehouseStock < item.quantity) {
          return {
            success: false,
            message: `Stok gudang untuk "${sp.name}" tidak mencukupi (${sp.warehouseStock} ${sp.unit} tersedia, diminta ${item.quantity} ${sp.unit}).`,
          }
        }
      } else {
        if (sp.stock < item.quantity) {
          return {
            success: false,
            message: `Stok toko untuk "${sp.name}" tidak mencukupi (${sp.stock} ${sp.unit} tersedia, diminta ${item.quantity} ${sp.unit}).`,
          }
        }
      }
    }

    let totalUnits = 0

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        totalUnits += item.quantity

        if (data.type === 'WAREHOUSE_TO_STORE') {
          await tx.sparepart.update({
            where: { id: item.sparepartId },
            data: {
              warehouseStock: { decrement: item.quantity },
              stock: { increment: item.quantity },
            },
          })
        } else {
          await tx.sparepart.update({
            where: { id: item.sparepartId },
            data: {
              stock: { decrement: item.quantity },
              warehouseStock: { increment: item.quantity },
            },
          })
        }

        await tx.stockTransfer.create({
          data: {
            branchId,
            userId: session.userId,
            sparepartId: item.sparepartId,
            type: data.type,
            quantity: item.quantity,
            notes: data.notes || null,
          },
        })
      }
    })

    const actionText = data.type === 'WAREHOUSE_TO_STORE' ? 'Gudang ➔ Toko' : 'Toko ➔ Gudang'
    createActivityLog({
      action: 'STOCK_TRANSFER',
      category: 'STOCK',
      level: 'INFO',
      description: `Transfer stok massal (${actionText}): ${data.items.length} jenis item (${totalUnits} unit)`,
      details: {
        itemsCount: data.items.length,
        totalUnits,
        type: data.type,
        notes: data.notes || null,
      },
      branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/stock-transfer')
    revalidatePath('/kasir/stock-transfer')
    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    revalidatePath('/admin/stock-toko')
    revalidatePath('/kasir/stock-toko')
    revalidatePath('/admin/stock-gudang')
    revalidatePath('/kasir/stock-gudang')

    const actionDesc = data.type === 'WAREHOUSE_TO_STORE' ? 'gudang ke toko' : 'toko ke gudang'
    return {
      success: true,
      message: `Berhasil memindahkan ${data.items.length} jenis barang (${totalUnits} unit) dari ${actionDesc}!`,
    }
  } catch (error: unknown) {
    console.error('Create Bulk Stock Transfer Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal melakukan transfer stock massal'
    return { success: false, message }
  }
}

// Alias for backwards compatibility
export const bulkTransferToStore = createBulkStockTransfer

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

export async function getPaginatedStockTransfers(
  page = 1,
  limit = 20,
  branchId?: string | null,
  dateStr?: string
) {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: page }

    const where: Record<string, unknown> = {
      ...getBranchFilter(session, branchId)
    }

    if (dateStr) {
      const targetDate = new Date(dateStr)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)
      where.transferDate = { gte: startOfDay, lte: endOfDay }
    }

    const [totalCount, data] = await prisma.$transaction([
      prisma.stockTransfer.count({ where }),
      prisma.stockTransfer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
    ])

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Get Paginated Stock Transfers Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
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

export async function getSparepartsForTransfer(branchId?: string | null) {
  try {
    const session = await getSession()
    if (!session) return []

    const where: Record<string, unknown> = {
      isActive: true,
      ...getBranchFilter(session, branchId),
    }

    const spareparts = await prisma.sparepart.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        warehouseStock: true,
        unit: true,
        sparepartBrand: true,
        etalase: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    })

    return spareparts
  } catch (error) {
    console.error('Get Spareparts For Transfer Error:', error)
    return []
  }
}