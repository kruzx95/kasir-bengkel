import { getSession } from '@/lib/session'
import StockTokoClient from '@/app/admin/stock-toko/StockTokoClient'
import { getSpareparts } from '@/actions/sparepart'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Toko',
}

export default async function KasirStockTokoPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const spareparts = await getSpareparts()

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockTokoClient initialSpareparts={spareparts} />
    </div>
  )
}
