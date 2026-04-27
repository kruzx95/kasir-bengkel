import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getSpareparts } from '@/actions/sparepart'
import StockClient from './StockClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stok Sparepart',
}

export default async function SparepartStockPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  const spareparts = await getSpareparts(session.branchId)

  return (
    <>
      <Header
        title="Stok Sparepart"
        subtitle={`Stok sparepart cabang ${session.branchName ?? ''}`}
      />
      <div className="p-6 animate-fade-in">
        <StockClient
          initialSpareparts={spareparts.map((sp) => ({
            id: sp.id,
            name: sp.name,
            sku: sp.sku,
            sellPrice: sp.sellPrice,
            stock: sp.stock,
            unit: sp.unit,
          }))}
        />
      </div>
    </>
  )
}
