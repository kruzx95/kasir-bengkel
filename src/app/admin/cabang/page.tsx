import Header from '@/components/layout/Header'
import { getBranches } from '@/actions/branch'
import CabangClient from './CabangClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Cabang',
}

export default async function CabangPage() {
  const branches = await getBranches()

  return (
    <>
      <Header
        title="Kelola Cabang"
        subtitle="Data cabang bengkel Irian Motor"
      />
      <div className="p-6 animate-fade-in">
        <CabangClient branches={branches} />
      </div>
    </>
  )
}
