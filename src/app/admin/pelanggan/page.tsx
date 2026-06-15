import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getPaginatedCustomers } from '@/actions/customer'
import AdminCustomersClient from './AdminCustomersClient'
import Pagination from '@/components/ui/Pagination'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Daftar Pelanggan',
}

export default async function AdminPelangganPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const branchId = typeof searchParams?.branch === 'string' ? searchParams.branch : undefined
  const limit = 50

  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null

  const isSuperAdmin = !session.branchId

  const [result, branches] = await Promise.all([
    getPaginatedCustomers(page, limit, branchId, search),
    isSuperAdmin ? prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }) : Promise.resolve([])
  ])

  return (
    <>
      <Header
        title="Daftar Pelanggan"
        subtitle="Data pelanggan dari semua cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <AdminCustomersClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialCustomers={result.data as any}
          branches={branches}
          totalCount={result.totalCount}
          initialBranch={branchId || ''}
        />
        <Pagination 
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
        />
      </div>
    </>
  )
}
