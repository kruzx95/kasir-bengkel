import Header from '@/components/layout/Header'
import ReportClient from '@/app/admin/laporan/ReportClient'
import { getReportData } from '@/actions/report'
import { getShopName } from '@/actions/settings'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laporan Pendapatan',
}

export default async function KasirLaporanPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const [initialReport, shopName] = await Promise.all([
    getReportData(),
    getShopName(),
  ])

  return (
    <>
      <Header
        title="Laporan & Ekspor"
        subtitle="Rekapitulasi data transaksi cabang Anda"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ReportClient
          branches={[]}
          initialData={initialReport.transactions}
          initialSummary={initialReport.summary}
          shopName={shopName}
        />
      </div>
    </>
  )
}
