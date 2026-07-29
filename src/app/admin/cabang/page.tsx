import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { getBranches } from '@/actions/branch'
import { getShopName } from '@/actions/settings'
import CabangClient from './CabangClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Cabang',
}

export default async function CabangPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  const [branches, shopName] = await Promise.all([
    getBranches(),
    getShopName(),
  ])

  return (
    <>
      <Header
        title="Kelola Cabang"
        subtitle={`Data cabang bengkel ${shopName}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <CabangClient branches={branches} />
      </div>
    </>
  )
}
