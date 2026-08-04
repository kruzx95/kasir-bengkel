import Header from '@/components/layout/Header'
import LogsClient from './LogsClient'
import { getActivityLogs } from '@/actions/log'
import { getBranches } from '@/actions/branch'
import { getSession } from '@/lib/session'
import { getShopName } from '@/actions/settings'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log Aktivitas | Mulya Lestari',
  description: 'Audit log aktivitas pengguna, transaksi, stok, dan sistem',
}

interface LogItem {
  id: string
  branchId: string | null
  userId: string | null
  userName: string
  userRole: 'ADMIN' | 'KASIR'
  action: string
  category: string
  description: string
  details: string | null
  ipAddress: string | null
  createdAt: string
  branch: { name: string; code: string } | null
}

interface BranchItem {
  id: string
  name: string
  code: string
}

export default async function AuditLogsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  const isSuperAdmin = session.role === 'ADMIN' && !session.branchId

  const [logsRes, branches, shopName] = await Promise.all([
    getActivityLogs({ page: 1, pageSize: 20 }),
    isSuperAdmin ? getBranches() : Promise.resolve([]),
    getShopName(),
  ])

  const initialLogs = (logsRes.success && logsRes.logs ? logsRes.logs : []) as unknown as LogItem[]
  const initialPagination = logsRes.pagination ?? {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  }
  const initialStats = logsRes.stats ?? {
    total: 0,
    totalTransactions: 0,
    totalStock: 0,
    totalMaster: 0,
    totalSystem: 0,
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <Header
        title="Log Aktivitas Systems"
        subtitle="Audit trail aktivitas transaksi, stok, master data, dan aksi sistem"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <LogsClient
          initialLogs={initialLogs}
          initialPagination={initialPagination}
          initialStats={initialStats}
          branches={branches as unknown as BranchItem[]}
          isSuperAdmin={isSuperAdmin}
          shopName={shopName}
        />
      </main>
    </div>
  )
}
