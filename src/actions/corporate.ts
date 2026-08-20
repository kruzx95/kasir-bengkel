'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter, canAccessCorporate, isAdmin, isDemoUser, type SessionPayload } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActivityLog, createDiffLog } from '@/lib/logger'

// ============================================
// CORPORATE CUSTOMER CRUD (Phase 5)
// ============================================

const CorporateSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  billingCycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('MONTHLY'),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
  hideServiceOnInvoice: z.boolean().default(false),
})

export type CorporateState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

export async function getCorporateCustomers(branchId?: string) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return []

  const corporates = await prisma.corporateCustomer.findMany({
    where: {
      isActive: true,
      ...getBranchFilter(session, branchId),
    },
    include: {
      branch: { select: { name: true } },
      customers: { select: { id: true, name: true, plateNumber: true } },
    },
    orderBy: { name: 'asc' },
  })

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  const result = await Promise.all(
    corporates.map(async (corp) => {
      const customerIds = corp.customers.map((c) => c.id)
      if (customerIds.length === 0) {
        return { ...corp, currentMonthTotal: 0, totalUnpaidAmount: 0, totalPaidThisMonth: 0 }
      }

      // Total PENDING / Korporat bulan ini
      const pendingAgg = await prisma.transaction.aggregate({
        where: {
          customerId: { in: customerIds },
          transactionDate: { gte: firstDay },
          OR: [
            { status: 'PENDING_CORPORATE' },
            { corporatePaymentLinks: { some: {} } }
          ]
        },
        _sum: { total: true, paidAmount: true },
      })
      const currentMonthTotal = pendingAgg._sum.total || 0
      const paidAmount = pendingAgg._sum.paidAmount || 0
      // Sisa piutang = total - paid
      const totalUnpaidAmount = Math.max(0, currentMonthTotal - paidAmount)

      // Total yang sudah dibayar bulan ini (semua status termasuk COMPLETED)
      const paidAgg = await prisma.corporatePayment.aggregate({
        where: {
          corporateCustomerId: corp.id,
          voidedAt: null,
          paidAt: { gte: firstDay },
        },
        _sum: { amount: true },
      })
      const totalPaidThisMonth = paidAgg._sum.amount || 0

      return { ...corp, currentMonthTotal, totalUnpaidAmount, totalPaidThisMonth }
    })
  )

  return result
}

export async function getCorporateCustomerById(id: string) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return null

  return prisma.corporateCustomer.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      customers: {
        select: {
          id: true,
          name: true,
          plateNumber: true,
          vehicleBrand: true,
          vehicleType: true,
          odometer: true,
          transactions: {
            select: { id: true, transactionDate: true },
            orderBy: { transactionDate: 'desc' },
            take: 1,
          },
          _count: {
            select: { transactions: true },
          },
        },
      },
    },
  })
}

export async function createCorporateCustomer(
  state: CorporateState,
  formData: FormData
): Promise<CorporateState> {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return { message: 'Unauthorized' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Penambahan pelanggan korporat dinonaktifkan (Lihat Saja).' }
  const safeSession: SessionPayload = session

  const hideService = formData.get('hideServiceOnInvoice') === 'on' || formData.get('hideServiceOnInvoice') === 'true'

  const isSuperAdmin = safeSession.role === 'ADMIN' && !safeSession.branchId
  const targetBranchId = isSuperAdmin ? formData.get('branchId') as string : safeSession.branchId!

  const validated = CorporateSchema.safeParse({
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    address: formData.get('address') || undefined,
    taxId: formData.get('taxId') || undefined,
    billingCycle: formData.get('billingCycle') || 'MONTHLY',
    branchId: targetBranchId,
    hideServiceOnInvoice: hideService,
  })

  if (!validated.success || !targetBranchId) {
    return { errors: validated.error?.flatten().fieldErrors || { branchId: ['Cabang wajib dipilih'] } }
  }

  try {
    const newCorp = await prisma.corporateCustomer.create({
      data: { ...validated.data, branchId: targetBranchId }
    })

    await createActivityLog({
      action: 'CORPORATE_CUSTOMER_CREATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Pelanggan korporat "${newCorp.name}" ditambahkan oleh ${safeSession.name}`,
      details: {
        id: newCorp.id,
        name: newCorp.name,
        contactPerson: newCorp.contactPerson,
        billingCycle: newCorp.billingCycle,
      },
      branchId: newCorp.branchId,
      userId: safeSession.userId,
      userName: safeSession.name,
      userRole: safeSession.role,
    })

    revalidatePath('/admin/korporat')
    revalidatePath('/kasir/korporat')
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
  if (!session || !canAccessCorporate(session)) return { message: 'Unauthorized' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Pengubahan data korporat dinonaktifkan (Lihat Saja).' }
  const safeSession: SessionPayload = session

  const hideService = formData.get('hideServiceOnInvoice') === 'on' || formData.get('hideServiceOnInvoice') === 'true'

  const isSuperAdmin = safeSession.role === 'ADMIN' && !safeSession.branchId
  const targetBranchId = isSuperAdmin ? formData.get('branchId') as string : safeSession.branchId!

  const validated = CorporateSchema.safeParse({
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    address: formData.get('address') || undefined,
    taxId: formData.get('taxId') || undefined,
    billingCycle: formData.get('billingCycle') || 'MONTHLY',
    branchId: targetBranchId,
    hideServiceOnInvoice: hideService,
  })

  if (!validated.success || !targetBranchId) {
    return { errors: validated.error?.flatten().fieldErrors || { branchId: ['Cabang wajib dipilih'] } }
  }

  try {
    const existing = await prisma.corporateCustomer.findUnique({ where: { id } })
    if (!existing) return { message: 'Data korporat tidak ditemukan' }

    const updated = await prisma.corporateCustomer.update({
      where: { id },
      data: { ...validated.data, branchId: targetBranchId }
    })

    await createDiffLog({
      action: 'CORPORATE_CUSTOMER_UPDATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Data pelanggan korporat "${updated.name}" diperbarui`,
      before: {
        name: existing.name,
        contactPerson: existing.contactPerson,
        contactPhone: existing.contactPhone,
        billingCycle: existing.billingCycle,
      },
      after: {
        name: updated.name,
        contactPerson: updated.contactPerson,
        contactPhone: updated.contactPhone,
        billingCycle: updated.billingCycle,
      },
      branchId: updated.branchId,
      userId: safeSession.userId,
      userName: safeSession.name,
      userRole: safeSession.role,
    })

    revalidatePath('/admin/korporat')
    revalidatePath('/kasir/korporat')
    revalidatePath(`/admin/korporat/${id}/tagihan`)
    revalidatePath(`/kasir/korporat/${id}/tagihan`)
    return { success: true, message: 'Data berhasil diperbarui' }
  } catch {
    return { message: 'Gagal memperbarui data' }
  }
}

export async function deleteCorporateCustomer(id: string) {
  const session = await getSession()
  if (!session || !isAdmin(session)) return { success: false, message: 'Hanya admin yang boleh menghapus korporat' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Penghapusan korporat dinonaktifkan.' }

  try {
    const existing = await prisma.corporateCustomer.findUnique({ where: { id } })
    if (!existing) return { success: false, message: 'Data korporat tidak ditemukan' }

    await prisma.corporateCustomer.update({ where: { id }, data: { isActive: false } })

    await createActivityLog({
      action: 'CORPORATE_CUSTOMER_DELETE',
      category: 'MASTER',
      level: 'WARNING',
      description: `Pelanggan korporat "${existing.name}" dinonaktifkan oleh ${session.name}`,
      details: { id: existing.id, name: existing.name },
      branchId: existing.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/admin/korporat')
    revalidatePath('/kasir/korporat')
    return { success: true }
  } catch {
    return { success: false, message: 'Gagal menghapus' }
  }
}

// Assign / unassign customer to corporate
export async function assignCustomerToCorporate(customerId: string, corporateCustomerId: string | null) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return { success: false, message: 'Unauthorized' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Pengubahan asosiasi pelanggan dinonaktifkan.' }

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: { corporateCustomerId },
    })
    revalidatePath('/admin/korporat')
    revalidatePath('/kasir/korporat')
    if (corporateCustomerId) {
      revalidatePath(`/admin/korporat/${corporateCustomerId}/tagihan`)
      revalidatePath(`/kasir/korporat/${corporateCustomerId}/tagihan`)
    }
    return { success: true }
  } catch {
    return { success: false, message: 'Gagal mengubah asosiasi pelanggan' }
  }
}

export type CreateCorporateVehicleState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

/**
 * Membuat pelanggan baru dan langsung meng-assign ke korporat tertentu.
 * Digunakan dari tab Kendaraan pada halaman Tagihan Korporat.
 */
export async function createCorporateVehicle(
  corporateCustomerId: string,
  branchId: string,
  state: CreateCorporateVehicleState,
  formData: FormData
): Promise<CreateCorporateVehicleState> {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return { message: 'Unauthorized' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Penambahan kendaraan korporat dinonaktifkan.' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { errors: { name: ['Nama kendaraan/pengemudi wajib diisi'] } }

  try {
    const customer = await prisma.customer.create({
      data: {
        branchId,
        corporateCustomerId,
        name: name.trim(),
        phone: (formData.get('phone') as string) || null,
        plateNumber: (formData.get('plateNumber') as string) || null,
        vehicleBrand: (formData.get('vehicleBrand') as string) || null,
        vehicleType: (formData.get('vehicleType') as string) || null,
        vehicleColor: (formData.get('vehicleColor') as string) || null,
        vehicleYear: (formData.get('vehicleYear') as string) || null,
        fuelType: (formData.get('fuelType') as 'GASOLINE' | 'DIESEL' | null) || null,
        odometer: formData.get('odometer') ? Number(formData.get('odometer')) : null,
        address: (formData.get('address') as string) || null,
      },
    })
    revalidatePath(`/admin/korporat/${corporateCustomerId}/tagihan`)
    revalidatePath(`/kasir/korporat/${corporateCustomerId}/tagihan`)
    revalidatePath('/admin/korporat')
    revalidatePath('/kasir/korporat')
    revalidatePath('/kasir/transaksi/baru')
    return { success: true, message: `Kendaraan ${customer.name} berhasil ditambahkan` }
  } catch {
    return { message: 'Gagal menambahkan kendaraan' }
  }
}

// ============================================
// CORPORATE BILLING (Phase 5 - Read)
// ============================================

export async function getCorporateBilling(corporateCustomerId: string, startDateStr?: string, endDateStr?: string) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return null

  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const startDate = startDateStr ? new Date(startDateStr) : defaultStart
  startDate.setHours(0, 0, 0, 0)
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today)
  endDate.setHours(23, 59, 59, 999)

  const corporate = await prisma.corporateCustomer.findUnique({
    where: { id: corporateCustomerId },
    include: { branch: { select: { name: true, id: true } } },
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
      transactionDate: { gte: startDate, lte: endDate },
      OR: [
        { status: 'PENDING_CORPORATE' },
        { corporatePaymentLinks: { some: {} } }
      ]
    },
    include: {
      customer: { select: { name: true, plateNumber: true } },
      items: { select: { itemType: true, itemName: true, quantity: true, unitPrice: true, subtotal: true } },
      branch: { select: { name: true } },
    },
    orderBy: { transactionDate: 'asc' },
  })

  const grandTotal = transactions.reduce((acc, t) => acc + t.total, 0)
  const totalPaid = transactions.reduce((acc, t) => acc + (t.paidAmount || 0), 0)
  const totalRemaining = Math.max(0, grandTotal - totalPaid)

  return {
    corporate,
    transactions,
    grandTotal,
    totalPaid,
    totalRemaining,
    startDate,
    endDate,
  }
}

// ============================================
// CORPORATE PAYMENT (Phase 5 - Write)
// ============================================

const PaymentAllocationSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().min(0),
})

const CreatePaymentSchema = z.object({
  corporateCustomerId: z.string().min(1),
  amount: z.number().min(1, 'Nominal pembayaran minimal 1'),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'QRIS']),
  notes: z.string().optional(),
  periodStart: z.string().min(1, 'Periode mulai wajib diisi'),
  periodEnd: z.string().min(1, 'Periode akhir wajib diisi'),
  allocations: z.array(PaymentAllocationSchema).min(1, 'Pilih minimal satu transaksi untuk dialokasikan'),
})

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>

export type PaymentResult = {
  success: boolean
  message?: string
  paymentId?: string
}

/**
 * Create a corporate payment (cicilan / lunas) and allocate to transactions.
 */
export async function createCorporatePayment(input: CreatePaymentInput): Promise<PaymentResult> {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return { success: false, message: 'Unauthorized' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Pencatatan pelunasan korporat dinonaktifkan (Lihat Saja).' }
  const safeSession: SessionPayload = session

  const validated = CreatePaymentSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, message: validated.error.issues[0]?.message || 'Validasi gagal' }
  }
  const data = validated.data

  // Validate allocation sum equals amount
  const totalAllocated = data.allocations.reduce((acc, a) => acc + a.amount, 0)
  if (Math.abs(totalAllocated - data.amount) > 0.01) {
    return { success: false, message: `Alokasi (${totalAllocated}) tidak sama dengan nominal bayar (${data.amount})` }
  }

  const periodStart = new Date(data.periodStart)
  periodStart.setHours(0, 0, 0, 0)
  const periodEnd = new Date(data.periodEnd)
  periodEnd.setHours(23, 59, 59, 999)

  // Determine target branch
  const corporate = await prisma.corporateCustomer.findUnique({
    where: { id: data.corporateCustomerId },
    select: { name: true, branchId: true, isActive: true },
  })
  if (!corporate || !corporate.isActive) {
    return { success: false, message: 'Korporat tidak ditemukan atau tidak aktif' }
  }
  // Branch access check
  if (safeSession.role === 'KASIR' && corporate.branchId !== safeSession.branchId) {
    return { success: false, message: 'Korporat bukan dari cabang Anda' }
  }
  if (safeSession.role === 'ADMIN' && safeSession.branchId && corporate.branchId !== safeSession.branchId) {
    return { success: false, message: 'Korporat bukan dari cabang Anda' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate all transactions belong to this corporate & PENDING_CORPORATE
      const customerIds = (
        await tx.customer.findMany({
          where: { corporateCustomerId: data.corporateCustomerId },
          select: { id: true },
        })
      ).map((c) => c.id)

      const txIds = data.allocations.map((a) => a.transactionId)
      const transactions = await tx.transaction.findMany({
        where: {
          id: { in: txIds },
          customerId: { in: customerIds },
          OR: [
            { status: 'PENDING_CORPORATE' },
            { corporatePaymentLinks: { some: {} } }
          ]
        },
        select: { id: true, total: true, paidAmount: true, invoiceNumber: true },
      })

      if (transactions.length !== txIds.length) {
        const found = new Set(transactions.map((t) => t.id))
        const missing = txIds.filter((id) => !found.has(id))
        throw new Error(`Transaksi tidak valid / bukan PENDING_CORPORATE: ${missing.join(', ')}`)
      }

      // Validate per-transaction allocation
      for (const alloc of data.allocations) {
        const t = transactions.find((tr) => tr.id === alloc.transactionId)!
        const remaining = t.total - (t.paidAmount || 0)
        if (alloc.amount > remaining + 0.01) {
          throw new Error(
            `Alokasi untuk ${t.invoiceNumber} (${alloc.amount}) melebihi sisa piutang (${remaining})`
          )
        }
      }

      // Create payment
      const payment = await tx.corporatePayment.create({
        data: {
          corporateCustomerId: data.corporateCustomerId,
          branchId: corporate.branchId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          paidAt: new Date(),
          createdById: safeSession.userId,
          periodStart,
          periodEnd,
          transactionLinks: {
            create: data.allocations.map((a) => ({
              transactionId: a.transactionId,
              amount: a.amount,
            })),
          },
        },
      })

      // Update each transaction
      for (const alloc of data.allocations) {
        const t = transactions.find((tr) => tr.id === alloc.transactionId)!
        const newPaid = (t.paidAmount || 0) + alloc.amount
        const newStatus = newPaid >= t.total - 0.01 ? 'COMPLETED' : 'PENDING_CORPORATE'
        await tx.transaction.update({
          where: { id: t.id },
          data: { paidAmount: newPaid, status: newStatus },
        })
      }

      return payment
    })

    await createActivityLog({
      action: 'CORPORATE_PAYMENT_CREATE',
      category: 'FINANCE',
      level: 'INFO',
      description: `Pelunasan piutang korporat "${corporate.name}" sebesar Rp ${data.amount.toLocaleString('id-ID')} via ${data.paymentMethod}`,
      details: {
        paymentId: result.id,
        corporateCustomerId: data.corporateCustomerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionCount: data.allocations.length,
      },
      branchId: corporate.branchId,
      userId: safeSession.userId,
      userName: safeSession.name,
      userRole: safeSession.role,
    })

    revalidatePath('/admin/korporat')
    revalidatePath(`/admin/korporat/${data.corporateCustomerId}/tagihan`)
    revalidatePath('/admin/laporan')

    return {
      success: true,
      message: `Pembayaran ${data.amount.toLocaleString('id-ID')} berhasil dicatat`,
      paymentId: result.id,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mencatat pembayaran'
    return { success: false, message }
  }
}

/**
 * Get payment history (riwayat pembayaran) for a corporate
 */
export async function getCorporatePaymentHistory(
  corporateCustomerId: string,
  options?: { includeVoided?: boolean; limit?: number }
) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return []

  const payments = await prisma.corporatePayment.findMany({
    where: {
      corporateCustomerId,
      ...(options?.includeVoided ? {} : { voidedAt: null }),
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      voidedBy: { select: { id: true, name: true } },
      transactionLinks: {
        include: {
          transaction: {
            select: {
              id: true,
              invoiceNumber: true,
              transactionDate: true,
              total: true,
              customer: { select: { name: true, plateNumber: true } },
            },
          },
        },
      },
    },
    orderBy: { paidAt: 'desc' },
    take: options?.limit ?? 100,
  })

  return payments
}

/**
 * Get single payment detail (untuk halaman print bukti bayar)
 */
export async function getCorporatePaymentById(paymentId: string) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return null

  const payment = await prisma.corporatePayment.findUnique({
    where: { id: paymentId },
    include: {
      corporateCustomer: {
        include: {
          branch: { select: { id: true, name: true, address: true, phone: true } },
        },
      },
      branch: { select: { id: true, name: true, address: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      voidedBy: { select: { id: true, name: true } },
      transactionLinks: {
        include: {
          transaction: {
            include: {
              customer: { select: { name: true, plateNumber: true } },
              items: { select: { itemType: true, itemName: true, quantity: true, unitPrice: true, subtotal: true } },
            },
          },
        },
      },
    },
  })

  return payment
}

/**
 * Void (batalkan) pembayaran korporat. Admin only.
 */
export async function voidCorporatePayment(
  paymentId: string,
  reason: string
): Promise<PaymentResult> {
  const session = await getSession()
  if (!session) return { success: false, message: 'Unauthorized' }
  if (!isAdmin(session)) return { success: false, message: 'Hanya admin yang boleh membatalkan pembayaran' }
  if (isDemoUser(session)) return { success: false, message: 'Mode Demo Aktif: Pembatalan pembayaran dinonaktifkan.' }
  const safeSession: SessionPayload = session

  if (!reason || reason.trim().length < 3) {
    return { success: false, message: 'Alasan pembatalan wajib diisi (min 3 karakter)' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.corporatePayment.findUnique({
        where: { id: paymentId },
        include: { transactionLinks: true },
      })
      if (!payment) throw new Error('Pembayaran tidak ditemukan')
      if (payment.voidedAt) throw new Error('Pembayaran sudah pernah dibatalkan')

      // Restore transaction paidAmount
      for (const link of payment.transactionLinks) {
        const t = await tx.transaction.findUnique({
          where: { id: link.transactionId },
          select: { paidAmount: true, total: true },
        })
        if (!t) continue
        const newPaid = Math.max(0, (t.paidAmount || 0) - link.amount)
        await tx.transaction.update({
          where: { id: link.transactionId },
          data: { paidAmount: newPaid, status: 'PENDING_CORPORATE' },
        })
      }

      // Mark payment as voided
      await tx.corporatePayment.update({
        where: { id: paymentId },
        data: {
          voidedAt: new Date(),
          voidedById: safeSession.userId,
          voidReason: reason,
        },
      })
    })

    await createActivityLog({
      action: 'CORPORATE_PAYMENT_VOID',
      category: 'FINANCE',
      level: 'CRITICAL',
      description: `Pembatalan (Void) pembayaran korporat #${paymentId.slice(-6)} oleh ${safeSession.name}. Alasan: ${reason}`,
      details: {
        paymentId,
        voidReason: reason,
      },
      userId: safeSession.userId,
      userName: safeSession.name,
      userRole: safeSession.role,
    })

    revalidatePath('/admin/korporat')
    revalidatePath('/admin/laporan')
    return { success: true, message: 'Pembayaran berhasil dibatalkan' }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan pembayaran'
    return { success: false, message }
  }
}

/**
 * Settle full billing for a period (legacy wrapper, panggil createCorporatePayment).
 */
export async function settleCorporateBilling(
  corporateCustomerId: string,
  startDateStr: string,
  endDateStr: string
) {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) return { success: false, message: 'Unauthorized' }

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

  const transactions = await prisma.transaction.findMany({
    where: {
      customerId: { in: customerIds },
      transactionDate: { gte: startDate, lte: endDate },
      OR: [
        { status: 'PENDING_CORPORATE' },
        { corporatePaymentLinks: { some: {} } }
      ]
    },
    select: { id: true, total: true, paidAmount: true },
  })

  const unpaid = transactions.filter((t) => (t.total - (t.paidAmount || 0)) > 0.01)

  if (unpaid.length === 0) {
    return { success: false, message: 'Tidak ada tagihan yang perlu dilunasi' }
  }

  const allocations = unpaid.map((t) => ({
    transactionId: t.id,
    amount: t.total - (t.paidAmount || 0),
  }))
  const amount = allocations.reduce((acc, a) => acc + a.amount, 0)

  return createCorporatePayment({
    corporateCustomerId,
    amount,
    paymentMethod: 'CASH',
    periodStart: startDateStr,
    periodEnd: endDateStr,
    allocations,
  })
}

// ============================================
// CORPORATE SERVICE TRANSACTION (Per Vehicle)
// ============================================

export type ServiceItem = {
  itemType: 'SERVICE' | 'SPAREPART'
  itemId?: string | null
  itemName: string
  quantity: number
  unitPrice: number
}

export type CorporateServiceInput = {
  customerId: string
  corporateCustomerId: string
  branchId: string
  mechanicId?: string | null
  items: ServiceItem[]
  discount?: number
  notes?: string | null
  odometer?: number | null
}

export type CorporateServiceResult = {
  success: boolean
  message?: string
  invoiceNumber?: string
  transactionId?: string
}

/**
 * Buat transaksi service untuk kendaraan korporat.
 * Status otomatis PENDING_CORPORATE, stok sparepart berkurang.
 */
export async function createCorporateServiceTransaction(
  input: CorporateServiceInput
): Promise<CorporateServiceResult> {
  const session = await getSession()
  if (!session || !canAccessCorporate(session)) {
    return { success: false, message: 'Unauthorized' }
  }

  if (isDemoUser(session)) {
    return {
      success: false,
      message: 'Mode Demo Aktif: Pembuatan transaksi korporat dinonaktifkan (Lihat Saja).',
    }
  }
  const safeSession: SessionPayload = session

  if (!input.items || input.items.length === 0) {
    return { success: false, message: 'Pilih minimal satu jasa atau sparepart' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate customer belongs to this corporate
      const customer = await tx.customer.findUnique({
        where: { id: input.customerId },
        select: { id: true, corporateCustomerId: true, name: true },
      })
      if (!customer || customer.corporateCustomerId !== input.corporateCustomerId) {
        throw new Error('Kendaraan tidak ditemukan atau bukan bagian dari korporat ini')
      }

      // Validate sparepart stock
      for (const item of input.items) {
        if (item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_')) {
          const sp = await tx.sparepart.findUnique({
            where: { id: item.itemId },
            select: { stock: true, name: true },
          })
          if (!sp || sp.stock < item.quantity) {
            throw new Error(
              `Stok ${sp?.name || 'sparepart'} tidak mencukupi (stok: ${sp?.stock ?? 0}, dibutuhkan: ${item.quantity})`
            )
          }
        }
      }

      // Generate unique invoice number (Format: INV-BRGCODE-YYYYMMDD-0001)
      const branch = await tx.branch.findUnique({
        where: { id: input.branchId },
        select: { code: true },
      })
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const prefix = `INV-${branch?.code || 'MAIN'}-${dateStr}-`

      const lastTx = await tx.transaction.findFirst({
        where: {
          branchId: input.branchId,
          invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      })

      let nextSeq = 1
      if (lastTx?.invoiceNumber) {
        const parts = lastTx.invoiceNumber.split('-')
        const lastSeq = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1
        }
      }

      let invoiceNumber = `${prefix}${nextSeq.toString().padStart(4, '0')}`
      let exists = await tx.transaction.findUnique({
        where: { invoiceNumber },
        select: { id: true },
      })

      while (exists) {
        nextSeq++
        invoiceNumber = `${prefix}${nextSeq.toString().padStart(4, '0')}`
        exists = await tx.transaction.findUnique({
          where: { invoiceNumber },
          select: { id: true },
        })
      }

      // Calculate totals
      let subtotal = 0
      let hasService = false
      let hasSparepart = false
      for (const item of input.items) {
        subtotal += item.quantity * item.unitPrice
        if (item.itemType === 'SERVICE') hasService = true
        if (item.itemType === 'SPAREPART') hasSparepart = true
      }
      const discount = input.discount ?? 0
      const total = Math.max(0, subtotal - discount)

      let type: 'SERVICE' | 'SPAREPART' | 'MIXED' = 'MIXED'
      if (hasService && !hasSparepart) type = 'SERVICE'
      if (!hasService && hasSparepart) type = 'SPAREPART'

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          branchId: input.branchId,
          userId: safeSession.userId,
          customerId: input.customerId,
          mechanicId: input.mechanicId || null,
          invoiceNumber,
          type,
          status: 'PENDING_CORPORATE',
          subtotal,
          discount,
          total,
          paymentMethod: 'CASH',
          notes: input.notes || null,
          odometer: input.odometer ?? null,
          transactionDate: new Date(),
          items: {
            create: input.items.map((item) => ({
              itemType: item.itemType,
              serviceId:
                item.itemType === 'SERVICE' && item.itemId && !item.itemId.startsWith('MANUAL_')
                  ? item.itemId
                  : null,
              sparepartId:
                item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_')
                  ? item.itemId
                  : null,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
      })

      // Deduct sparepart stock
      for (const item of input.items) {
        if (item.itemType === 'SPAREPART' && item.itemId && !item.itemId.startsWith('MANUAL_')) {
          await tx.sparepart.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      // Update customer odometer
      if (input.odometer !== undefined && input.odometer !== null) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { odometer: input.odometer },
        })
      }

      return transaction
    })

    revalidatePath(`/admin/korporat/${input.corporateCustomerId}/tagihan`)
    revalidatePath(`/kasir/korporat/${input.corporateCustomerId}/tagihan`)
    revalidatePath('/admin/korporat')
    revalidatePath('/admin/transaksi')
    revalidatePath('/kasir/transaksi')

    return {
      success: true,
      message: `Nota service berhasil dibuat: ${result.invoiceNumber}`,
      invoiceNumber: result.invoiceNumber,
      transactionId: result.id,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat transaksi service'
    return { success: false, message }
  }
}