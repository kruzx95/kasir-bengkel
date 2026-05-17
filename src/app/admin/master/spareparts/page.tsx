import Header from '@/components/layout/Header'
import { getSpareparts } from '@/actions/sparepart'
import { getBranches } from '@/actions/branch'
import SparepartsClient from './SparepartsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Sparepart',
}

export default async function SparepartsPage() {
  const [spareparts, branches] = await Promise.all([
    getSpareparts(),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Master Sparepart"
        subtitle="Kelola daftar sparepart dan stok per cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <SparepartsClient spareparts={spareparts} branches={branches} />
      </div>
    </>
  )
}
