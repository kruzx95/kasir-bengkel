import Header from '@/components/layout/Header'
import { getPaginatedSpareparts } from '@/actions/sparepart'
import { getBranches } from '@/actions/branch'
import SparepartsClient from './SparepartsClient'
import Pagination from '@/components/ui/Pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Sparepart',
}

export default async function SparepartsPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const branchId = typeof searchParams?.branch === 'string' ? searchParams.branch : undefined

  const limit = 50

  const [result, branches] = await Promise.all([
    getPaginatedSpareparts(page, limit, branchId, search),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Master Sparepart"
        subtitle="Kelola daftar sparepart dan stok per cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <SparepartsClient 
          spareparts={result.data} 
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
