'use server'

import { prisma } from '@/lib/prisma'
import { getSession, getBranchFilter, isDemoUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { createActivityLog } from '@/lib/logger'
import { MemoStatus } from '@/generated/prisma/client'

export interface ChecklistTuneUp {
  busi?: boolean
  saringanUdara?: boolean
  saringanBensin?: boolean
  throttleBody?: boolean
  airRadiator?: boolean
  airWiper?: boolean
  cairanRem?: boolean
  cairanKopling?: boolean
  oliPowersteering?: boolean
  lampuLampu?: boolean
  filterCabinAc?: boolean
  karetWiper?: boolean
  fanbelt?: boolean
  airAccu?: boolean
  kalibrasiInjektor?: boolean
  gurahRuangBakar?: boolean
}

export interface ChecklistBrakes {
  kampasRem?: boolean
  karetRem?: boolean
  minyakRem?: boolean
  komponenRemLain?: boolean
}

export interface ChecklistSuspension {
  laharRoda?: boolean
  bolaBolaStir?: boolean
  bushingDanKaret?: boolean
  shockBreakerDepanBelakang?: boolean
  cvJoint?: boolean
  bautBautKolong?: boolean
}

export interface MemoServiceItemInput {
  serviceId?: string | null
  name: string
  estimatedPrice?: number
  buyPrice?: number | null
  notes?: string | null
}

export interface MemoSparepartItemInput {
  sparepartId?: string | null
  name: string
  quantity: number
  unit: string
  estimatedPrice?: number
  buyPrice?: number | null
  notes?: string | null
}

export interface CreateMemoInput {
  queueNumber?: string | null
  customerName: string
  customerPhone?: string | null
  customerAddress?: string | null
  vehiclePlate: string
  vehicleModel?: string | null
  odometer?: number | null
  complaints?: string | null
  initialDiagnosis?: string | null
  estimatedDuration?: string | null
  notes?: string | null
  mechanicId?: string | null
  branchId?: string | null
  checklistTuneUp?: ChecklistTuneUp
  checklistBrakes?: ChecklistBrakes
  checklistSuspension?: ChecklistSuspension
  services?: MemoServiceItemInput[]
  spareparts?: MemoSparepartItemInput[]
}

// Generate sequential Memo Number: MEMO-YYMM-XXXX
async function generateMemoNumber(branchId: string): Promise<string> {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const prefix = `MEMO-${year}${month}-`

  const lastMemo = await prisma.serviceMemo.findFirst({
    where: {
      memoNumber: { startsWith: prefix }
    },
    orderBy: { memoNumber: 'desc' },
    select: { memoNumber: true }
  })

  let sequence = 1
  if (lastMemo && lastMemo.memoNumber) {
    const lastSeqStr = lastMemo.memoNumber.split('-').pop()
    if (lastSeqStr) {
      const parsed = parseInt(lastSeqStr, 10)
      if (!isNaN(parsed)) sequence = parsed + 1
    }
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

export async function createMemo(input: CreateMemoInput) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo: Pembuatan memo dinonaktifkan (Lihat Saja).' }
    }

    if (!input.customerName.trim() || !input.vehiclePlate.trim()) {
      return { success: false, message: 'Nama pelanggan dan No. Polisi wajib diisi.' }
    }

    const branchId = input.branchId || session.branchId
    if (!branchId) {
      return { success: false, message: 'Cabang wajib ditentukan.' }
    }

    const memoNumber = await generateMemoNumber(branchId)

    const memo = await prisma.serviceMemo.create({
      data: {
        memoNumber,
        queueNumber: input.queueNumber?.trim() || null,
        branchId,
        userId: session.userId,
        mechanicId: input.mechanicId || null,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        customerAddress: input.customerAddress?.trim() || null,
        vehiclePlate: input.vehiclePlate.trim().toUpperCase(),
        vehicleModel: input.vehicleModel?.trim() || null,
        odometer: input.odometer ? Number(input.odometer) : null,
        complaints: input.complaints?.trim() || null,
        initialDiagnosis: input.initialDiagnosis?.trim() || null,
        estimatedDuration: input.estimatedDuration?.trim() || null,
        notes: input.notes?.trim() || null,
        status: 'DRAFT',
        checklistTuneUp: input.checklistTuneUp ? JSON.parse(JSON.stringify(input.checklistTuneUp)) : undefined,
        checklistBrakes: input.checklistBrakes ? JSON.parse(JSON.stringify(input.checklistBrakes)) : undefined,
        checklistSuspension: input.checklistSuspension ? JSON.parse(JSON.stringify(input.checklistSuspension)) : undefined,
        services: {
          create: (input.services || [])
            .filter((s) => s.name && s.name.trim().length > 0)
            .map((s) => ({
              serviceId: s.serviceId || null,
              name: s.name.trim(),
              estimatedPrice: Number(s.estimatedPrice || 0),
              buyPrice: s.buyPrice !== undefined && s.buyPrice !== null ? Number(s.buyPrice) : null,
              notes: s.notes?.trim() || null,
            })),
        },
        spareparts: {
          create: (input.spareparts || [])
            .filter((sp) => sp.name && sp.name.trim().length > 0)
            .map((sp) => ({
              sparepartId: sp.sparepartId || null,
              name: sp.name.trim(),
              quantity: Math.max(1, Number(sp.quantity || 1)),
              unit: sp.unit?.trim() || 'pcs',
              estimatedPrice: Number(sp.estimatedPrice || 0),
              buyPrice: sp.buyPrice !== undefined && sp.buyPrice !== null ? Number(sp.buyPrice) : null,
              notes: sp.notes?.trim() || null,
            })),
        },
      },
      include: {
        services: true,
        spareparts: true,
        mechanic: true,
        branch: true,
      }
    })

    await createActivityLog({
      action: 'MEMO_CREATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Memo Servis baru dibuat: ${memo.memoNumber} (${memo.vehiclePlate} - ${memo.customerName}) oleh ${session.name}`,
      details: {
        memoId: memo.id,
        memoNumber: memo.memoNumber,
        vehiclePlate: memo.vehiclePlate,
        customerName: memo.customerName,
      },
      branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/mekanik')
    revalidatePath('/kasir/memo')
    revalidatePath('/admin/memo')

    return { success: true, message: `Memo ${memo.memoNumber} berhasil dibuat`, memoId: memo.id }
  } catch (error: unknown) {
    console.error('Create Memo Error:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Gagal membuat memo servis' }
  }
}

export async function updateMemo(id: string, input: Partial<CreateMemoInput> & { status?: MemoStatus }) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo: Update memo dinonaktifkan (Lihat Saja).' }
    }

    const existing = await prisma.serviceMemo.findUnique({
      where: { id },
      include: { services: true, spareparts: true }
    })

    if (!existing) {
      return { success: false, message: 'Memo tidak ditemukan' }
    }

    if (existing.status === 'CONVERTED') {
      return { success: false, message: 'Memo yang sudah dikonversi menjadi invoice tidak dapat diubah lagi.' }
    }

    // Atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing items if services/spareparts array provided
      if (input.services) {
        await tx.memoServiceItem.deleteMany({ where: { memoId: id } })
      }
      if (input.spareparts) {
        await tx.memoSparepartItem.deleteMany({ where: { memoId: id } })
      }

      // 2. Update parent memo
      const updateData: Record<string, unknown> = {}
      if (input.queueNumber !== undefined) updateData.queueNumber = input.queueNumber?.trim() || null
      if (input.customerName !== undefined) updateData.customerName = input.customerName.trim()
      if (input.customerPhone !== undefined) updateData.customerPhone = input.customerPhone?.trim() || null
      if (input.customerAddress !== undefined) updateData.customerAddress = input.customerAddress?.trim() || null
      if (input.vehiclePlate !== undefined) updateData.vehiclePlate = input.vehiclePlate.trim().toUpperCase()
      if (input.vehicleModel !== undefined) updateData.vehicleModel = input.vehicleModel?.trim() || null
      if (input.odometer !== undefined) updateData.odometer = input.odometer ? Number(input.odometer) : null
      if (input.complaints !== undefined) updateData.complaints = input.complaints?.trim() || null
      if (input.initialDiagnosis !== undefined) updateData.initialDiagnosis = input.initialDiagnosis?.trim() || null
      if (input.estimatedDuration !== undefined) updateData.estimatedDuration = input.estimatedDuration?.trim() || null
      if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null
      if (input.mechanicId !== undefined) updateData.mechanicId = input.mechanicId || null
      if (input.status) updateData.status = input.status

      if (input.checklistTuneUp) updateData.checklistTuneUp = JSON.parse(JSON.stringify(input.checklistTuneUp))
      if (input.checklistBrakes) updateData.checklistBrakes = JSON.parse(JSON.stringify(input.checklistBrakes))
      if (input.checklistSuspension) updateData.checklistSuspension = JSON.parse(JSON.stringify(input.checklistSuspension))

      if (input.services) {
        updateData.services = {
          create: input.services
            .filter((s) => s.name && s.name.trim().length > 0)
            .map((s) => ({
              serviceId: s.serviceId || null,
              name: s.name.trim(),
              estimatedPrice: Number(s.estimatedPrice || 0),
              buyPrice: s.buyPrice !== undefined && s.buyPrice !== null ? Number(s.buyPrice) : null,
              notes: s.notes?.trim() || null,
            })),
        }
      }

      if (input.spareparts) {
        updateData.spareparts = {
          create: input.spareparts
            .filter((sp) => sp.name && sp.name.trim().length > 0)
            .map((sp) => ({
              sparepartId: sp.sparepartId || null,
              name: sp.name.trim(),
              quantity: Math.max(1, Number(sp.quantity || 1)),
              unit: sp.unit?.trim() || 'pcs',
              estimatedPrice: Number(sp.estimatedPrice || 0),
              buyPrice: sp.buyPrice !== undefined && sp.buyPrice !== null ? Number(sp.buyPrice) : null,
              notes: sp.notes?.trim() || null,
            })),
        }
      }

      await tx.serviceMemo.update({
        where: { id },
        data: updateData,
      })
    })

    await createActivityLog({
      action: 'MEMO_UPDATE',
      category: 'MASTER',
      level: 'INFO',
      description: `Memo Servis ${existing.memoNumber} diperbarui oleh ${session.name}`,
      details: { memoId: id, memoNumber: existing.memoNumber },
      branchId: existing.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/mekanik')
    revalidatePath('/kasir/memo')
    revalidatePath('/admin/memo')

    return { success: true, message: 'Memo berhasil diperbarui' }
  } catch (error: unknown) {
    console.error('Update Memo Error:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui memo' }
  }
}

export async function updateMemoStatus(id: string, status: MemoStatus) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo: Perubahan status memo dinonaktifkan.' }
    }

    const memo = await prisma.serviceMemo.update({
      where: { id },
      data: { status }
    })

    await createActivityLog({
      action: 'MEMO_STATUS_CHANGE',
      category: 'MASTER',
      level: 'INFO',
      description: `Status Memo ${memo.memoNumber} diubah menjadi ${status} oleh ${session.name}`,
      details: { memoId: id, memoNumber: memo.memoNumber, status },
      branchId: memo.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/mekanik')
    revalidatePath('/kasir/memo')
    revalidatePath('/admin/memo')

    return { success: true, message: `Status memo diubah menjadi ${status}` }
  } catch (error: unknown) {
    console.error('Update Memo Status Error:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Gagal mengubah status memo' }
  }
}

export async function deleteMemo(id: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (isDemoUser(session)) {
      return { success: false, message: 'Mode Demo: Hapus memo dinonaktifkan.' }
    }

    const memo = await prisma.serviceMemo.findUnique({ where: { id } })
    if (!memo) return { success: false, message: 'Memo tidak ditemukan' }

    if (memo.status === 'CONVERTED') {
      return { success: false, message: 'Memo yang sudah dikonversi menjadi invoice tidak dapat dihapus.' }
    }

    await prisma.serviceMemo.delete({ where: { id } })

    await createActivityLog({
      action: 'MEMO_DELETE',
      category: 'MASTER',
      level: 'WARNING',
      description: `Memo Servis ${memo.memoNumber} dihapus oleh ${session.name}`,
      details: { memoId: id, memoNumber: memo.memoNumber },
      branchId: memo.branchId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    })

    revalidatePath('/mekanik')
    revalidatePath('/kasir/memo')
    revalidatePath('/admin/memo')

    return { success: true, message: 'Memo berhasil dihapus' }
  } catch (error: unknown) {
    console.error('Delete Memo Error:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus memo' }
  }
}

export async function getMemos(options?: {
  branchId?: string | null
  status?: MemoStatus
  search?: string
  page?: number
  limit?: number
}) {
  try {
    const session = await getSession()
    if (!session) return { data: [], totalCount: 0, totalPages: 0, currentPage: 1 }

    const page = options?.page || 1
    const limit = options?.limit || 20

    const where: Record<string, unknown> = {
      ...getBranchFilter(session, options?.branchId),
    }

    if (options?.status) {
      where.status = options.status
    }

    if (options?.search) {
      const search = options.search.trim()
      where.OR = [
        { memoNumber: { contains: search } },
        { customerName: { contains: search } },
        { vehiclePlate: { contains: search } },
        { vehicleModel: { contains: search } },
        { customerPhone: { contains: search } },
      ]
    }

    const [totalCount, data] = await prisma.$transaction([
      prisma.serviceMemo.count({ where }),
      prisma.serviceMemo.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          services: true,
          spareparts: true,
          mechanic: { select: { id: true, name: true, phone: true } },
          user: { select: { id: true, name: true, role: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error('Get Memos Error:', error)
    return { data: [], totalCount: 0, totalPages: 0, currentPage: 1 }
  }
}

export async function getMemoById(id: string) {
  try {
    const session = await getSession()
    if (!session) return null

    const memo = await prisma.serviceMemo.findUnique({
      where: { id },
      include: {
        services: true,
        spareparts: true,
        mechanic: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true, role: true } },
        branch: true,
        transaction: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          }
        }
      }
    })

    return memo
  } catch (error) {
    console.error('Get Memo By ID Error:', error)
    return null
  }
}
