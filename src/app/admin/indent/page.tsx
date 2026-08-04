import Header from '@/components/layout/Header'
import IndentClient from './IndentClient'
import { getPaginatedIndentOrders } from '@/actions/indent'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Indent',
}

export default async function AdminIndentPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const limit = 20

  const result = await getPaginatedIndentOrders(page, limit, undefined, 'CUSTOMER')

  return (
    <>
      <Header
        title="Barang Indent"
        subtitle="Kelola pemesanan sparepart yang belum diterima dari supplier"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <IndentClient initialData={result.data as any} />
        <Pagination 
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
        />
      </div>
    </>
  )
}
