import Header from '@/components/layout/Header'
import ReportClient from './ReportClient'
import { getReportData } from '@/actions/report'
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

  return (
    <>
      <Header
        title="Laporan & Ekspor"
        subtitle="Unduh rekapitulasi data transaksi ke format CSV/Excel"
      />
      <div className="p-6 animate-fade-in">
        <ReportClient 
          branches={branches} 
          initialData={initialReport.transactions} 
          initialSummary={initialReport.summary}
        />
      </div>
    </>
  )
}
