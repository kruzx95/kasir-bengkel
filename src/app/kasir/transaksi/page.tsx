import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getTransactions } from '@/actions/transaction'
import TransactionsClient from './TransactionsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar Transaksi',
}

export default async function KasirTransaksiPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  // Get today's transactions
  const transactions = await getTransactions(session.branchId)

  return (
    <>
      <Header
        title="Daftar Transaksi"
        subtitle={`Transaksi cabang ${session.branchName ?? ''} hari ini`}
      />
      <div className="p-6 animate-fade-in">
        <TransactionsClient initialTransactions={transactions as any} />
      </div>
    </>
  )
}
