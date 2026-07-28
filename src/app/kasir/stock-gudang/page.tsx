import { getSession } from '@/lib/session'
import StockGudangClient from '@/app/admin/stock-gudang/StockGudangClient'
import { getSpareparts } from '@/actions/sparepart'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Gudang',
}

export default async function KasirStockGudangPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const spareparts = await getSpareparts()

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockGudangClient initialSpareparts={spareparts} />
    </div>
  )
}
