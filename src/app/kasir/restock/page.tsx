import Header from '@/components/layout/Header'
import RestocksClient from '@/app/admin/restock/RestocksClient'
import { getRestocks } from '@/actions/restock'
import { getPaginatedIndentOrders } from '@/actions/indent'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Masuk',
}

export default async function KasirRestockPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const limit = 20

  const [poResult, history] = await Promise.all([
    getPaginatedIndentOrders(page, limit, session.branchId, 'RESTOCK'),
    getRestocks(session.branchId),
  ])

  return (
    <>
      <Header
        title="Barang Masuk (PO)"
        subtitle="Riwayat pembelian stok sparepart dari supplier"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <RestocksClient initialPOs={poResult.data as any} initialHistory={history as any} />
        <Pagination 
          currentPage={poResult.currentPage}
          totalPages={poResult.totalPages}
          totalCount={poResult.totalCount}
        />
      </div>
    </>
  )
}
