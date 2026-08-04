import Header from '@/components/layout/Header'
import { getPaginatedServices } from '@/actions/service'
import { getBranches } from '@/actions/branch'
import ServicesClient from './ServicesClient'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Jasa Servis',
}

export default async function ServicesPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const branchId = typeof searchParams?.branch === 'string' ? searchParams.branch : undefined

  const limit = 50

  const [result, branches] = await Promise.all([
    getPaginatedServices(page, limit, branchId, search),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Master Jasa Servis"
        subtitle="Kelola daftar jasa servis per cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ServicesClient 
          services={result.data} 
          branches={branches} 
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
