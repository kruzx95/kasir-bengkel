import { getSession } from '@/lib/session'
import StockTransferClient from '@/app/admin/stock-transfer/StockTransferClient'
import { getPaginatedStockTransfers } from '@/actions/stock-transfer'
import { redirect } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transfer Stok',
}

export default async function KasirStockTransferPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const limit = 20

  const result = await getPaginatedStockTransfers(page, limit, session.branchId)

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <StockTransferClient
        initialTransfers={result.data as any}
        branches={session.branchId ? [{ id: session.branchId, name: 'Cabang Kasir' }] : []}
      />
      <Pagination 
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
      />
    </div>
  )
}
