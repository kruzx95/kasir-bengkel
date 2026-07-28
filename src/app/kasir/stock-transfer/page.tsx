import { getSession } from '@/lib/session'
import StockTransferClient from '@/app/admin/stock-transfer/StockTransferClient'
import { getStockTransfers } from '@/actions/stock-transfer'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transfer Stok',
}

export default async function KasirStockTransferPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const transfers = await getStockTransfers()

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockTransferClient initialTransfers={transfers} />
    </div>
  )
}
