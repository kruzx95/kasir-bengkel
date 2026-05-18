import Header from '@/components/layout/Header'
import KorporatClient from './KorporatClient'
import { getCorporateCustomers } from '@/actions/corporate'
import { getBranches } from '@/actions/branch'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pelanggan Korporat',
}

export default async function KorporatPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  const [corporates, branches] = await Promise.all([
    getCorporateCustomers(),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Pelanggan Korporat"
        subtitle="Kelola perusahaan/instansi dengan sistem tagihan borongan"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <KorporatClient initialData={corporates} branches={branches} />
      </div>
    </>
  )
}
