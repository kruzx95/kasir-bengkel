import Header from '@/components/layout/Header'
import DashboardClient from './DashboardClient'
import { getDashboardMetrics } from '@/actions/dashboard'
import { getShopName } from '@/actions/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
}

export default async function AdminDashboardPage() {
  const [metrics, shopName] = await Promise.all([
    getDashboardMetrics(),
    getShopName(),
  ])

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle={`Pantau performa bisnis seluruh cabang ${shopName}`}
      />
      {metrics ? <DashboardClient metrics={metrics} /> : <p className="p-6">Gagal memuat data.</p>}
    </>
  )
}
