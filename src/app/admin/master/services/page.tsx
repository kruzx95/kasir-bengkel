import Header from '@/components/layout/Header'
import { getServices } from '@/actions/service'
import { getBranches } from '@/actions/branch'
import ServicesClient from './ServicesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Jasa Servis',
}

export default async function ServicesPage() {
  const [services, branches] = await Promise.all([
    getServices(),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Master Jasa Servis"
        subtitle="Kelola daftar jasa servis per cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ServicesClient services={services} branches={branches} />
      </div>
    </>
  )
}
