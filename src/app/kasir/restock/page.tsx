import Header from '@/components/layout/Header'
import RestocksClient from '@/app/admin/restock/RestocksClient'
import { getRestocks } from '@/actions/restock'
import { getIndentOrders } from '@/actions/indent'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Masuk',
}

export default async function KasirRestockPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const [restockPOs, history] = await Promise.all([
    getIndentOrders(undefined, undefined, 'RESTOCK'),
    getRestocks(),
  ])

  return (
    <>
      <Header
        title="Barang Masuk (PO)"
        subtitle="Riwayat pembelian stok sparepart dari supplier"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <RestocksClient initialPOs={restockPOs} initialHistory={history} />
      </div>
    </>
  )
}
