import Header from '@/components/layout/Header'
import ServicesClient from '@/app/admin/master/services/ServicesClient'
import { getPaginatedServices } from '@/actions/service'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jasa Servis',
}

export default async function KasirJasaServisPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const limit = 50

  const result = await getPaginatedServices(page, limit, session.branchId, search)

  return (
    <>
      <Header
        title="Jasa Servis"
        subtitle="Kelola daftar jasa servis cabang Anda"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ServicesClient 
          services={result.data} 
          branches={[]} 
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
