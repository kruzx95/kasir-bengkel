import Header from '@/components/layout/Header'
import DashboardClient from './DashboardClient'
import { getDashboardMetrics } from '@/actions/dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle="Pantau performa bisnis seluruh cabang Irian Motor"
      />
      {metrics ? <DashboardClient metrics={metrics} /> : <p className="p-6">Gagal memuat data.</p>}
    </>
  )
}
