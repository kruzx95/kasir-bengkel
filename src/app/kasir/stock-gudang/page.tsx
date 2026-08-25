import { getSession } from '@/lib/session'
import StockGudangClient from '@/app/admin/stock-gudang/StockGudangClient'
import { getPaginatedSpareparts } from '@/actions/sparepart'
import { redirect } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Gudang',
}

export default async function KasirStockGudangPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const sortBy = typeof searchParams?.sortBy === 'string' ? searchParams.sortBy : 'name'
  const sortOrder = searchParams?.sortOrder === 'desc' ? 'desc' : 'asc'

  const result = await getPaginatedSpareparts(page, 50, session.branchId, search, sortBy, sortOrder)

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      <StockGudangClient
        initialSpareparts={result.data}
        branches={session.branchId ? [{ id: session.branchId, name: 'Cabang Kasir' }] : []}
        totalCount={result.totalCount}
      />
      <Pagination 
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
      />
    </div>
  )
}
