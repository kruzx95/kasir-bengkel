'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SparepartSchema = z.object({
  name: z.string().min(1, 'Nama sparepart wajib diisi'),
  sku: z.string().optional(),
  buyPrice: z.coerce.number().min(0, 'Harga beli tidak boleh negatif'),
  sellPrice: z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
})

export type SparepartState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getSpareparts(branchId?: string | null) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = { isActive: true }
  if (branchId) {
    where.branchId = branchId
  } else if (session.role === 'KASIR' && session.branchId) {
    where.branchId = session.branchId
  }

  return prisma.sparepart.findMany({
    where,
    include: { branch: true },
    orderBy: { name: 'asc' },
  })
}

export async function getSparepartById(id: string) {
  return prisma.sparepart.findUnique({
    where: { id },
    include: { branch: true },
  })
}

export async function getLowStockSpareparts(branchId?: string | null, threshold = 5) {
  const where: Record<string, unknown> = {
    isActive: true,
    stock: { lte: threshold },
  }
  if (branchId) where.branchId = branchId

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
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  const validatedFields = SparepartSchema.safeParse({
    name: formData.get('name'),
    sku: formData.get('sku') || undefined,
    buyPrice: formData.get('buyPrice'),
    sellPrice: formData.get('sellPrice'),
    stock: formData.get('stock'),
    unit: formData.get('unit'),
    branchId: formData.get('branchId'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.sparepart.create({
      data: {
        name: validatedFields.data.name,
        sku: validatedFields.data.sku || null,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        branchId: validatedFields.data.branchId,
      },
    })
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Sparepart berhasil ditambahkan' }
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
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  const validatedFields = SparepartSchema.safeParse({
    name: formData.get('name'),
    sku: formData.get('sku') || undefined,
    buyPrice: formData.get('buyPrice'),
    sellPrice: formData.get('sellPrice'),
    stock: formData.get('stock'),
    unit: formData.get('unit'),
    branchId: formData.get('branchId'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.sparepart.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        sku: validatedFields.data.sku || null,
        buyPrice: validatedFields.data.buyPrice,
        sellPrice: validatedFields.data.sellPrice,
        stock: validatedFields.data.stock,
        unit: validatedFields.data.unit,
        branchId: validatedFields.data.branchId,
      },
    })
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Sparepart berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui sparepart' }
  }
}

export async function deleteSparepart(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  try {
    await prisma.sparepart.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/admin/master/spareparts')
    return { success: true, message: 'Sparepart berhasil dihapus' }
  } catch {
    return { message: 'Gagal menghapus sparepart' }
  }
}
