import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import MemoForm from '@/components/mekanik/MemoForm'
import { getMemoById } from '@/actions/memo'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const memo = await prisma.serviceMemo.findUnique({ where: { id } })
  if (!memo) return { title: 'Edit Memo Servis' }
  return { title: `Edit Memo - ${memo.memoNumber}` }
}

export default async function EditMemoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const memo = await getMemoById(id)

  if (!memo) return notFound()

  const branchFilter = memo.branchId ? { branchId: memo.branchId } : {}

  const [mechanics, services, spareparts, customers] = await Promise.all([
    prisma.mechanic.findMany({
      where: { isActive: true, ...branchFilter },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.service.findMany({
      where: { isActive: true, ...branchFilter },
      select: { id: true, name: true, price: true },
      orderBy: { name: 'asc' },
      take: 200,
    }),
    prisma.sparepart.findMany({
      where: { isActive: true, ...branchFilter },
      select: { id: true, name: true, sellPrice: true, buyPrice: true, stock: true, unit: true },
      orderBy: { name: 'asc' },
      take: 300,
    }),
    prisma.customer.findMany({
      where: branchFilter,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        plateNumber: true,
        vehicleBrand: true,
        vehicleType: true,
        vehicleYear: true,
        odometer: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
  ])

  return (
    <MemoForm
      initialData={memo}
      mechanics={mechanics}
      availableServices={services}
      availableSpareparts={spareparts}
      availableCustomers={customers}
      branchId={memo.branchId}
      isEdit={true}
      basePath="/mekanik"
    />
  )
}
