import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getPaginatedSpareparts } from '@/actions/sparepart'
import StockClient from './StockClient'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stok Sparepart',
}

export default async function SparepartStockPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const limit = 50

  const session = await getSession()
  if (!session || !session.branchId) return null

  const result = await getPaginatedSpareparts(page, limit, session.branchId, search)
  const spareparts = result.data

  return (
    <>
      <Header
        title="Stok Sparepart"
        subtitle={`Stok sparepart cabang ${session.branchName ?? ''}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <StockClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialSpareparts={spareparts.map((sp: any) => ({
            id: sp.id,
            name: sp.name,
            sku: sp.sku,
            sparepartType: sp.sparepartType,
            sparepartBrand: sp.sparepartBrand,
            sparepartSize: sp.sparepartSize,
            buyPrice: sp.buyPrice,
            sellPrice: sp.sellPrice,
            stock: sp.stock,
            unit: sp.unit,
            branchId: sp.branchId,
          }))}
          branches={[{ id: session.branchId, code: '', name: session.branchName ?? 'Cabang Anda' }]}
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
