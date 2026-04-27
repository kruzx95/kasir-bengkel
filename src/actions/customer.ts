'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CustomerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().optional(),
  plateNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleYear: z.string().optional(),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
})

export type CustomerState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getCustomers(branchId?: string | null, search?: string) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = {}

  if (branchId) {
    where.branchId = branchId
  } else if (session.role === 'KASIR' && session.branchId) {
    where.branchId = session.branchId
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  return prisma.customer.findMany({
    where,
    include: { branch: true },
    orderBy: { name: 'asc' },
    take: 50,
  })
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      branch: true,
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true },
      },
    },
  })
}

export async function createCustomer(
  state: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const session = await getSession()
  if (!session) return { message: 'Unauthorized' }

  const branchId = session.role === 'KASIR' && session.branchId
    ? session.branchId
    : formData.get('branchId') as string

  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    plateNumber: formData.get('plateNumber') || undefined,
    vehicleType: formData.get('vehicleType') || undefined,
    vehicleYear: formData.get('vehicleYear') || undefined,
    branchId,
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.customer.create({
      data: {
        name: validatedFields.data.name,
        phone: validatedFields.data.phone || null,
        plateNumber: validatedFields.data.plateNumber || null,
        vehicleType: validatedFields.data.vehicleType || null,
        vehicleYear: validatedFields.data.vehicleYear || null,
        branchId: validatedFields.data.branchId,
      },
    })
    revalidatePath('/kasir/pelanggan')
    revalidatePath('/admin/pelanggan')
    return { success: true, message: 'Pelanggan berhasil ditambahkan' }
  } catch {
    return { message: 'Gagal menambahkan pelanggan' }
  }
}

export async function updateCustomer(
  id: string,
  state: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const session = await getSession()
  if (!session) return { message: 'Unauthorized' }

  const branchId = session.role === 'KASIR' && session.branchId
    ? session.branchId
    : formData.get('branchId') as string

  const validatedFields = CustomerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    plateNumber: formData.get('plateNumber') || undefined,
    vehicleType: formData.get('vehicleType') || undefined,
    vehicleYear: formData.get('vehicleYear') || undefined,
    branchId,
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        phone: validatedFields.data.phone || null,
        plateNumber: validatedFields.data.plateNumber || null,
        vehicleType: validatedFields.data.vehicleType || null,
        vehicleYear: validatedFields.data.vehicleYear || null,
      },
    })
    revalidatePath('/kasir/pelanggan')
    return { success: true, message: 'Pelanggan berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui pelanggan' }
  }
}
