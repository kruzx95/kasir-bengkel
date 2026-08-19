'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActivityLog, createDiffLog } from '@/lib/logger'

const SparepartSchema = z.object({
  name: z.string().min(1, 'Nama sparepart wajib diisi'),
  sku: z.string().optional(),
  sparepartType: z.string().optional(),
  sparepartBrand: z.string().optional(),
  sparepartSize: z.string().optional(),
  etalase: z.string().optional(),
  buyPrice: z.coerce.number().min(0, 'Harga beli tidak boleh negatif'),
  sellPrice: z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
})

export type SparepartState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getSpareparts(branchId?: string | null) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = {
    isActive: true,
    ...getBranchFilter(session, branchId)
  }

  return prisma.sparepart.findMany({
    where,
    include: { branch: true },
    orderBy: { name: 'asc' },
  })
}

export type PaginatedResult<T> = {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getPaginatedSpareparts(
  page = 1,
  limit = 50,
  branchId?: string | null,
  search?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<PaginatedResult<any>> {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: page }

    const where: Record<string, unknown> = {
      isActive: true,
      ...getBranchFilter(session, branchId)
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { sparepartType: { contains: search } },
        { sparepartBrand: { contains: search } },
        { etalase: { contains: search } },
      ]
    }

    const [totalCount, data] = await prisma.$transaction([
      prisma.sparepart.count({ where }),
      prisma.sparepart.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { branch: true },
        orderBy: { name: 'asc' },
      })
    ])

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Get Paginated Spareparts Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
}

export async function getSparepartById(id: string) {
  return prisma.sparepart.findUnique({
    where: { id },
    include: { branch: true },
  })
}

export async function getLowStockSpareparts(branchId?: string | null, threshold = 5) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = {
    isActive: true,
    stock: { lte: threshold },
    ...getBranchFilter(session, branchId)
  }

  return prisma.sparepart.findMany({
    where,
    include: { branch: true },
    orderBy: { stock: 'asc' },
  })
}

export async function createSparepart(
  state: SparepartState,
  formData: FormData
): Promise<SparepartState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized' }
  }

  const validatedFields = SparepartSchema.safeParse({
    name: formData.get('name'),
    sku: formData.get('sku') || undefined,
    sparepartType: formData.get('sparepartType') || undefined,
    sparepartBrand: formData.get('sparepartBrand') || undefined,
    sparepartSize: formData.get('sparepartSize') || undefined,
    etalase: formData.get('etalase') || undefined,
    buyPrice: formData.get('buyPrice'),
    sellPrice: formData.get('sellPrice'),
    stock: formData.get('stock'),
    unit: formData.get('unit'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    const isSuperAdmin = session.role === 'ADMIN' && !session.branchId
    let branches = []
    if (isSuperAdmin) {
      branches = await prisma.branch.findMany({ where: { isActive: true } })
    } else {
      branches = [{ id: session.branchId! }]
    }

    await prisma.sparepart.createMany({
      data: branches.map((branch) => ({
        name: validatedFields.data.name,
        sku: validatedFields.data.sku || null,
        sparepartType: validatedFields.data.sparepartType || null,
        sparepartBrand: validatedFields.data.sparepartBrand || null,
        sparepartSize: validatedFields.data.sparepartSize || null,
        etalase: validatedFields.data.etalase || null,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        branchId: branch.id,
      })),
    })

    await createActivityLog({
      action: 'SPAREPART_CREATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Sparepart baru "${validatedFields.data.name}" ditambahkan ke ${branches.length} cabang`,
      details: {
        name: validatedFields.data.name,
        sku: validatedFields.data.sku,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
      },
      branchId: session.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    return { success: true, message: `Sparepart berhasil ditambahkan ke ${branches.length} cabang` }
  } catch {
    return { message: 'Gagal menambahkan sparepart' }
  }
}

export async function updateSparepart(
  id: string,
  state: SparepartState,
  formData: FormData
): Promise<SparepartState> {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized' }
  }

  const validatedFields = SparepartSchema.safeParse({
    name: formData.get('name'),
    sku: formData.get('sku') || undefined,
    sparepartType: formData.get('sparepartType') || undefined,
    sparepartBrand: formData.get('sparepartBrand') || undefined,
    sparepartSize: formData.get('sparepartSize') || undefined,
    etalase: formData.get('etalase') || undefined,
    buyPrice: formData.get('buyPrice'),
    sellPrice: formData.get('sellPrice'),
    stock: formData.get('stock'),
    unit: formData.get('unit'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const branchId = formData.get('branchId') as string | null

  try {
    const existing = await prisma.sparepart.findUnique({
      where: { id },
      include: { branch: true }
    })

    if (!existing) {
      return { message: 'Sparepart tidak ditemukan' }
    }

    const updated = await prisma.sparepart.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        sku: validatedFields.data.sku || null,
        sparepartType: validatedFields.data.sparepartType || null,
        sparepartBrand: validatedFields.data.sparepartBrand || null,
        sparepartSize: validatedFields.data.sparepartSize || null,
        etalase: validatedFields.data.etalase || null,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        ...(branchId && { branchId }),
      },
    })

    const isPriceOrStockChanged =
      existing.buyPrice !== updated.buyPrice ||
      existing.sellPrice !== updated.sellPrice ||
      existing.stock !== updated.stock

    await createDiffLog({
      action: 'SPAREPART_UPDATE',
      category: isPriceOrStockChanged ? 'STOCK' : 'MASTER',
      level: isPriceOrStockChanged ? 'WARNING' : 'INFO',
      description: `Data sparepart "${updated.name}" diperbarui${isPriceOrStockChanged ? ' (Perubahan Harga/Stok)' : ''}`,
      before: {
        name: existing.name,
        buyPrice: existing.buyPrice,
        sellPrice: existing.sellPrice,
        stock: existing.stock,
        unit: existing.unit,
      },
      after: {
        name: updated.name,
        buyPrice: updated.buyPrice,
        sellPrice: updated.sellPrice,
        stock: updated.stock,
        unit: updated.unit,
      },
      branchId: updated.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    return { success: true, message: 'Sparepart berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui sparepart' }
  }
}

export async function deleteSparepart(id: string) {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized' }
  }

  try {
    const existing = await prisma.sparepart.findUnique({ where: { id } })
    if (!existing) {
      return { message: 'Sparepart tidak ditemukan' }
    }

    // Soft delete: nonaktifkan sparepart agar riwayat transaksi & restock tetap utuh
    await prisma.sparepart.update({
      where: { id },
      data: { isActive: false },
    })

    await createActivityLog({
      action: 'SPAREPART_DELETE',
      category: 'MASTER',
      level: 'WARNING',
      description: `Sparepart "${existing.name}" dinonaktifkan oleh ${session.name}`,
      details: {
        id: existing.id,
        name: existing.name,
        sku: existing.sku,
        stock: existing.stock,
      },
      branchId: existing.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    return { success: true, message: 'Sparepart berhasil dinonaktifkan' }
  } catch {
    return { message: 'Gagal menonaktifkan sparepart' }
  }
}
