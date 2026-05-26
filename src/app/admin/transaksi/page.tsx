import Header from '@/components/layout/Header'
import { getTransactions } from '@/actions/transaction'
import { prisma } from '@/lib/prisma'
import AdminTransactionsClient from './AdminTransactionsClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Semua Transaksi',
}

export default async function AdminTransaksiPage() {
  const todayStr = new Date().toISOString().slice(0, 10)

  const [transactions, branches] = await Promise.all([
    getTransactions(undefined, todayStr),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <>
      <Header
        title="Semua Transaksi"
        subtitle="Riwayat transaksi dari semua cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <AdminTransactionsClient
          initialData={transactions}
          initialDate={todayStr}
          branches={branches}
        />
      </div>
    </>
  )
}
