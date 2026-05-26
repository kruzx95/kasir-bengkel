import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getPaginatedCustomers } from '@/actions/customer'
import CustomersClient from './CustomersClient'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar Pelanggan',
}

export default async function PelangganPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const limit = 50

  const session = await getSession()
  if (!session || !session.branchId) return null

  const result = await getPaginatedCustomers(page, limit, session.branchId, search)
  const customers = result.data

  return (
    <>
      <Header
        title="Daftar Pelanggan"
        subtitle={`Data pelanggan cabang ${session.branchName ?? ''}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <CustomersClient
          initialCustomers={customers as Parameters<typeof CustomersClient>[0]['initialCustomers']}
          branchId={session.branchId}
          totalCount={result.totalCount}
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
