import { getSession } from '@/lib/session'
import StockTokoClient from './StockTokoClient'
import { getPaginatedSpareparts } from '@/actions/sparepart'
import { prisma } from '@/lib/prisma'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Toko',
}

export default async function StockTokoPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const sortBy = typeof searchParams?.sortBy === 'string' ? searchParams.sortBy : 'name'
  const sortOrder = searchParams?.sortOrder === 'desc' ? 'desc' : 'asc'

  const [result, branches] = await Promise.all([
    session 
      ? getPaginatedSpareparts(page, 50, session.branchId, search, sortBy, sortOrder)
      : { data: [], totalCount: 0, totalPages: 0, currentPage: 1 },
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      <StockTokoClient
        initialSpareparts={result.data}
        branches={branches}
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