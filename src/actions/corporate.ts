'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// CORPORATE CUSTOMER CRUD
// ============================================

const CorporateSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  billingCycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('MONTHLY'),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
})

export type CorporateState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getCorporateCustomers(branchId?: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return []

  return prisma.corporateCustomer.findMany({
    where: {
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: { select: { name: true } },
      customers: { select: { id: true, name: true, plateNumber: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getCorporateCustomerById(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null

  return prisma.corporateCustomer.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      customers: {
        select: { id: true, name: true, plateNumber: true, vehicleBrand: true, vehicleType: true },
      },
    },
  })
}

export async function createCorporateCustomer(
  state: CorporateState,
  formData: FormData
): Promise<CorporateState> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return { message: 'Unauthorized' }

  const validated = CorporateSchema.safeParse({
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    address: formData.get('address') || undefined,
    taxId: formData.get('taxId') || undefined,
    billingCycle: formData.get('billingCycle') || 'MONTHLY',
    branchId: formData.get('branchId'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await prisma.corporateCustomer.create({ data: validated.data })
    revalidatePath('/admin/korporat')
    return { success: true, message: 'Pelanggan korporat berhasil ditambahkan' }
  } catch {
    return { message: 'Gagal menambahkan pelanggan korporat' }
  }
}

export async function updateCorporateCustomer(
  id: string,
  state: CorporateState,
  formData: FormData
): Promise<CorporateState> {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return { message: 'Unauthorized' }

  const validated = CorporateSchema.safeParse({
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    address: formData.get('address') || undefined,
    taxId: formData.get('taxId') || undefined,
    billingCycle: formData.get('billingCycle') || 'MONTHLY',
    branchId: formData.get('branchId'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await prisma.corporateCustomer.update({ where: { id }, data: validated.data })
    revalidatePath('/admin/korporat')
    return { success: true, message: 'Data berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui data' }
  }
}

export async function deleteCorporateCustomer(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return { message: 'Unauthorized' }

  try {
    await prisma.corporateCustomer.update({ where: { id }, data: { isActive: false } })
    revalidatePath('/admin/korporat')
    return { success: true }
  } catch {
    return { message: 'Gagal menghapus' }
  }
}

// Assign / unassign customer to corporate
export async function assignCustomerToCorporate(customerId: string, corporateCustomerId: string | null) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return { success: false, message: 'Unauthorized' }

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: { corporateCustomerId },
    })
    revalidatePath('/admin/korporat')
    return { success: true }
  } catch {
    return { success: false, message: 'Gagal mengubah asosiasi pelanggan' }
  }
}

// ============================================
// CORPORATE BILLING
// ============================================

export async function getCorporateBilling(corporateCustomerId: string, startDateStr?: string, endDateStr?: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  const corporate = await prisma.corporateCustomer.findUnique({
    where: { id: corporateCustomerId },
    include: { branch: { select: { name: true } } },
  })
  if (!corporate) return null

  // Get all customers under this corporate
  const customerIds = (
    await prisma.customer.findMany({
      where: { corporateCustomerId },
      select: { id: true },
    })
  ).map((c) => c.id)

  const transactions = await prisma.transaction.findMany({
    where: {
      customerId: { in: customerIds },
      status: 'PENDING_CORPORATE',
      transactionDate: { gte: startDate, lte: endDate },
    },
    include: {
      customer: { select: { name: true, plateNumber: true } },
      items: { select: { itemName: true, itemType: true, quantity: true, unitPrice: true, subtotal: true } },
      branch: { select: { name: true } },
    },
    orderBy: { transactionDate: 'asc' },
  })

  const grandTotal = transactions.reduce((acc, t) => acc + t.total, 0)

  return { corporate, transactions, grandTotal, startDate, endDate }
}

export async function settleCorporateBilling(corporateCustomerId: string, startDateStr: string, endDateStr: string) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return { success: false, message: 'Unauthorized' }

  try {
    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)

    const customerIds = (
      await prisma.customer.findMany({
        where: { corporateCustomerId },
        select: { id: true },
      })
    ).map((c) => c.id)

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: {
          customerId: { in: customerIds },
          status: 'PENDING_CORPORATE',
          transactionDate: { gte: startDate, lte: endDate },
        },
        data: { status: 'COMPLETED' },
      })
      return updated
    })

    revalidatePath('/admin/korporat')
    revalidatePath('/admin/laporan')
    return { success: true, message: `${result.count} transaksi berhasil dilunasi` }
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal melunasi tagihan' }
  }
}
