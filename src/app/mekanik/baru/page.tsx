import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import MemoForm from '@/components/mekanik/MemoForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buat Memo Servis Baru',
}

export default async function NewMemoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const branchFilter = session.branchId ? { branchId: session.branchId } : {}

  const [mechanics, services, spareparts] = await Promise.all([
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
      select: { id: true, name: true, sellPrice: true, stock: true, unit: true },
      orderBy: { name: 'asc' },
      take: 300,
    }),
  ])

  return (
    <MemoForm
      mechanics={mechanics}
      availableServices={services}
      availableSpareparts={spareparts}
      basePath="/mekanik"
    />
  )
}
