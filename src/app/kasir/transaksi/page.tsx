import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getTransactions } from '@/actions/transaction'
import TransactionsClient from './TransactionsClient'
import type { Metadata } from 'next'

type KasirTransactionRow = {
  id: string
  invoiceNumber: string
  type: string
  status: string
  total: number
  paymentMethod: string
  createdAt: Date
  customer: { name: string; plateNumber: string | null } | null
  user: { name: string }
  branch: { name: string }
  mechanic?: { name: string } | null
  items: { itemType: string; subtotal: number }[]
}

export const metadata: Metadata = {
  title: 'Daftar Transaksi',
}

export default async function KasirTransaksiPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  // Get today's transactions
  const transactions = await getTransactions(session.branchId) as KasirTransactionRow[]

  return (
    <>
      <Header
        title="Daftar Transaksi"
        subtitle={`Transaksi cabang ${session.branchName ?? ''} hari ini`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <TransactionsClient initialTransactions={transactions} />
      </div>
    </>
  )
}
