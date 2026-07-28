import Header from '@/components/layout/Header'
import KorporatClient from '@/app/admin/korporat/KorporatClient'
import { getCorporateCustomers } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pelanggan Korporat',
}

export default async function KasirKorporatPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const corporates = await getCorporateCustomers()

  return (
    <>
      <Header
        title="Pelanggan Korporat"
        subtitle="Kelola perusahaan/instansi dengan sistem tagihan borongan"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <KorporatClient
          initialData={corporates as never}
          branches={[]}
          isAdmin={false}
        />
      </div>
    </>
  )
}
