import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getPaginatedTransactions } from '@/actions/transaction'
import TransactionsClient from './TransactionsClient'
import Pagination from '@/components/ui/Pagination'
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

export default async function KasirTransaksiPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams
  const page = Number(searchParams?.page) || 1
  const limit = 50

  const session = await getSession()
  if (!session || !session.branchId) return null

  // Get today's paginated transactions
  const result = await getPaginatedTransactions(page, limit, session.branchId)
  const transactions = result.data as KasirTransactionRow[]

  return (
    <>
      <Header
        title="Daftar Transaksi"
        subtitle={`Transaksi cabang ${session.branchName ?? ''} hari ini`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <TransactionsClient initialTransactions={transactions} />
        <Pagination 
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
        />
      </div>
    </>
  )
}
