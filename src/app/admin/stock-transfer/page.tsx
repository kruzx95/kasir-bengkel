import { getSession } from '@/lib/session'
import StockTransferClient from './StockTransferClient'
import { getPaginatedStockTransfers } from '@/actions/stock-transfer'
import { prisma } from '@/lib/prisma'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transfer Stok Gudang',
}

export default async function StockTransferPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const limit = 20

  const [result, branches] = await Promise.all([
    session
      ? getPaginatedStockTransfers(page, limit)
      : { data: [], totalCount: 0, totalPages: 0, currentPage: 1 },
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <StockTransferClient initialTransfers={result.data as any} branches={branches} />
      <Pagination 
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
      />
    </div>
  )
}