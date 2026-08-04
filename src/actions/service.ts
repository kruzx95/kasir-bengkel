'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ServiceSchema = z.object({
  name: z.string().min(1, 'Nama servis wajib diisi'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  category: z.string().optional(),
})

export type ServiceState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export type PaginatedResult<T> = {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export async function getServices(branchId?: string | null) {
  const session = await getSession()
  if (!session) return []

  const where: Record<string, unknown> = { 
    isActive: true,
    ...getBranchFilter(session, branchId)
  }

  return prisma.service.findMany({
    where,
    include: { branch: true },
    orderBy: { name: 'asc' },
  })
}

export async function getPaginatedServices(
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
        { category: { contains: search } },
      ]
    }

    const [totalCount, data] = await prisma.$transaction([
      prisma.service.count({ where }),
      prisma.service.findMany({
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
    console.error('Get Paginated Services Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
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
  if (!session) {
    return { message: 'Unauthorized' }
  }

  const validatedFields = ServiceSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    category: formData.get('category') || undefined,
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

    await prisma.service.createMany({
      data: branches.map((branch) => ({
        name: validatedFields.data.name,
        price: validatedFields.data.price,
        category: validatedFields.data.category || null,
        branchId: branch.id,
      })),
    })

    revalidatePath('/admin/master/services')
    revalidatePath('/kasir/jasa-servis')
    return { success: true, message: `Jasa servis berhasil ditambahkan ke ${branches.length} cabang` }
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
  if (!session) {
    return { message: 'Unauthorized' }
  }

  const validatedFields = ServiceSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    category: formData.get('category') || undefined,
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const branchId = formData.get('branchId') as string | null

  try {
    await prisma.service.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        price: validatedFields.data.price,
        category: validatedFields.data.category || null,
        ...(branchId && { branchId }),
      },
    })
    revalidatePath('/admin/master/services')
    revalidatePath('/kasir/jasa-servis')
    return { success: true, message: 'Jasa servis berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui jasa servis' }
  }
}

export async function deleteService(id: string) {
  const session = await getSession()
  if (!session) {
    return { message: 'Unauthorized' }
  }

  try {
    // Soft delete: nonaktifkan servis agar riwayat transaksi tetap utuh
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/admin/master/services')
    revalidatePath('/kasir/jasa-servis')
    return { success: true, message: 'Jasa servis berhasil dinonaktifkan' }
  } catch {
    return { message: 'Gagal menonaktifkan jasa servis' }
  }
}
