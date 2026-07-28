'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SparepartSchema = z.object({
  name: z.string().min(1, 'Nama sparepart wajib diisi'),
  sku: z.string().optional(),
  sparepartType: z.string().optional(),
  sparepartBrand: z.string().optional(),
  sparepartSize: z.string().optional(),
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
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        branchId: branch.id,
      })),
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
    await prisma.sparepart.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        sku: validatedFields.data.sku || null,
        sparepartType: validatedFields.data.sparepartType || null,
        sparepartBrand: validatedFields.data.sparepartBrand || null,
        sparepartSize: validatedFields.data.sparepartSize || null,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        ...(branchId && { branchId }),
      },
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
    // Soft delete: nonaktifkan sparepart agar riwayat transaksi & restock tetap utuh
    await prisma.sparepart.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/admin/master/spareparts')
    revalidatePath('/kasir/sparepart')
    return { success: true, message: 'Sparepart berhasil dinonaktifkan' }
  } catch {
    return { message: 'Gagal menonaktifkan sparepart' }
  }
}
