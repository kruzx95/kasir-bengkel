import Header from '@/components/layout/Header'
import DashboardClient from '@/app/admin/DashboardClient'
import { getDashboardMetrics } from '@/actions/dashboard'
import { getSession } from '@/lib/session'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Kasir',
}

export default async function KasirDashboardPage() {
  const session = await getSession()
  const metrics = await getDashboardMetrics()

  return (
    <>
      <Header
        title={`Halo, ${session?.name || 'Kasir'} 👋`}
        subtitle={`Dashboard performa cabang ${session?.branchName || ''}`}
      />
      {metrics ? <DashboardClient metrics={metrics} /> : <p className="p-6">Gagal memuat data.</p>}
    </>
  )
}
