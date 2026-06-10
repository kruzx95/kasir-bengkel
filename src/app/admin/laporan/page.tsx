import Header from '@/components/layout/Header'
import ReportClient from './ReportClient'
import { getReportData } from '@/actions/report'
import { getShopName } from '@/actions/settings'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laporan Pendapatan',
}

export default async function AdminLaporanPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  // Initial Data
  const initialReport = await getReportData()
  
  // Branches for filter dropdown
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true }
  })

  const shopName = await getShopName()

  return (
    <>
      <Header
        title="Laporan & Ekspor"
        subtitle="Unduh rekapitulasi data transaksi ke format CSV/Excel"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ReportClient 
          branches={branches} 
          initialData={initialReport.transactions} 
          initialSummary={initialReport.summary}
          shopName={shopName}
        />
      </div>
    </>
  )
}
