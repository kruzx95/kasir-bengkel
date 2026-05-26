'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CustomerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().optional(),
  address: z.string().optional(),
  plateNumber: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleYear: z.string().optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL']).optional(),
  odometer: z.coerce.number().int().min(0).optional(),
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

export type PaginatedResult<T> = {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getPaginatedCustomers(
  page = 1,
  limit = 50,
  branchId?: string | null,
  search?: string
): Promise<PaginatedResult<any>> {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: page }

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

    const [totalCount, data] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
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
    console.error('Get Paginated Customers Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
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
    address: formData.get('address') || undefined,
    plateNumber: formData.get('plateNumber') || undefined,
    vehicleBrand: formData.get('vehicleBrand') || undefined,
    vehicleType: formData.get('vehicleType') || undefined,
    vehicleColor: formData.get('vehicleColor') || undefined,
    vehicleYear: formData.get('vehicleYear') || undefined,
    fuelType: (formData.get('fuelType') as string) || undefined,
    odometer: formData.get('odometer') ? Number(formData.get('odometer')) : undefined,
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
        address: validatedFields.data.address || null,
        plateNumber: validatedFields.data.plateNumber || null,
        vehicleBrand: validatedFields.data.vehicleBrand || null,
        vehicleType: validatedFields.data.vehicleType || null,
        vehicleColor: validatedFields.data.vehicleColor || null,
        vehicleYear: validatedFields.data.vehicleYear || null,
        fuelType: validatedFields.data.fuelType || null,
        odometer: validatedFields.data.odometer ?? null,
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
    address: formData.get('address') || undefined,
    plateNumber: formData.get('plateNumber') || undefined,
    vehicleBrand: formData.get('vehicleBrand') || undefined,
    vehicleType: formData.get('vehicleType') || undefined,
    vehicleColor: formData.get('vehicleColor') || undefined,
    vehicleYear: formData.get('vehicleYear') || undefined,
    fuelType: (formData.get('fuelType') as string) || undefined,
    odometer: formData.get('odometer') ? Number(formData.get('odometer')) : undefined,
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
        address: validatedFields.data.address || null,
        plateNumber: validatedFields.data.plateNumber || null,
        vehicleBrand: validatedFields.data.vehicleBrand || null,
        vehicleType: validatedFields.data.vehicleType || null,
        vehicleColor: validatedFields.data.vehicleColor || null,
        vehicleYear: validatedFields.data.vehicleYear || null,
        fuelType: validatedFields.data.fuelType || null,
        odometer: validatedFields.data.odometer ?? null,
      },
    })
    revalidatePath('/kasir/pelanggan')
    return { success: true, message: 'Pelanggan berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui pelanggan' }
  }
}
