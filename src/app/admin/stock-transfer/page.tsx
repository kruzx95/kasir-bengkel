import { getSession } from '@/lib/session'
import StockTransferClient from './StockTransferClient'
import { getStockTransfers } from '@/actions/stock-transfer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transfer Stok Gudang',
}

export default async function StockTransferPage() {
  const session = await getSession()
  const transfers = session ? await getStockTransfers() : []

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockTransferClient initialTransfers={transfers} />
    </div>
  )
}