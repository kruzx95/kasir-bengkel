import { getSession } from '@/lib/session'
import StockGudangClient from './StockGudangClient'
import { getSpareparts } from '@/actions/sparepart'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Gudang',
}

export default async function StockGudangPage() {
  const session = await getSession()
  const spareparts = session ? await getSpareparts() : []

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <StockGudangClient initialSpareparts={spareparts} />
    </div>
  )
}