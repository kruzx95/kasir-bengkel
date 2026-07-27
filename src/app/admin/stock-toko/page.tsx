import { getSession } from '@/lib/session'
import StockTokoClient from './StockTokoClient'
import { getSpareparts } from '@/actions/sparepart'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Toko',
}

export default async function StockTokoPage() {
  const session = await getSession()
  const spareparts = session ? await getSpareparts() : []

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockTokoClient initialSpareparts={spareparts} />
    </div>
  )
}