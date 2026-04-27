'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ServiceSchema = z.object({
  name: z.string().min(1, 'Nama servis wajib diisi'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  category: z.string().optional(),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
})

export type ServiceState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getServices(branchId?: string | null) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = { isActive: true }
  if (branchId) {
    where.branchId = branchId
  } else if (session.role === 'KASIR' && session.branchId) {
    where.branchId = session.branchId
  }

  return prisma.service.findMany({
    where,
    include: { branch: true },
    orderBy: { name: 'asc' },
  })
}

export async function getServiceById(id: string) {
  return prisma.service.findUnique({
    where: { id },
    include: { branch: true },
  })
}

export async function createService(
  state: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  const validatedFields = ServiceSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    category: formData.get('category') || undefined,
    branchId: formData.get('branchId'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.service.create({
      data: {
        name: validatedFields.data.name,
        price: validatedFields.data.price,
        category: validatedFields.data.category || null,
        branchId: validatedFields.data.branchId,
      },
    })
    revalidatePath('/admin/master/services')
    return { success: true, message: 'Jasa servis berhasil ditambahkan' }
  } catch {
    return { message: 'Gagal menambahkan jasa servis' }
  }
}

export async function updateService(
  id: string,
  state: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  const validatedFields = ServiceSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    category: formData.get('category') || undefined,
    branchId: formData.get('branchId'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.service.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        price: validatedFields.data.price,
        category: validatedFields.data.category || null,
        branchId: validatedFields.data.branchId,
      },
    })
    revalidatePath('/admin/master/services')
    return { success: true, message: 'Jasa servis berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui jasa servis' }
  }
}

export async function deleteService(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { message: 'Unauthorized' }
  }

  try {
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/admin/master/services')
    return { success: true, message: 'Jasa servis berhasil dihapus' }
  } catch {
    return { message: 'Gagal menghapus jasa servis' }
  }
}
