import Header from '@/components/layout/Header'
import KorporatClient from './KorporatClient'
import { getCorporateCustomers } from '@/actions/corporate'
import { getBranches } from '@/actions/branch'
import { getSession, isAdmin } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pelanggan Korporat',
}

export default async function KorporatPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN' && session.role !== 'KASIR') redirect('/')

  const [corporates, branches] = await Promise.all([
    getCorporateCustomers(),
    getBranches(),
  ])

  // Debug
  console.log('🔵 KorporatPage branches (server)', branches, 'count:', branches?.length)

  return (
    <>
      <Header
        title="Pelanggan Korporat"
        subtitle="Kelola perusahaan/instansi dengan sistem tagihan borongan"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <KorporatClient
          initialData={corporates}
          branches={branches}
          isAdmin={isAdmin(session)}
        />
      </div>
    </>
  )
}