import Header from '@/components/layout/Header'
import ServicesClient from '@/app/admin/master/services/ServicesClient'
import { getServices } from '@/actions/service'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jasa Servis',
}

export default async function KasirJasaServisPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const services = await getServices()

  return (
    <>
      <Header
        title="Jasa Servis"
        subtitle="Kelola daftar jasa servis cabang Anda"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ServicesClient services={services} branches={[]} />
      </div>
    </>
  )
}
