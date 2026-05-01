import Header from '@/components/layout/Header'
import RestocksClient from './RestocksClient'
import { getRestocks } from '@/actions/restock'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Masuk (Restock)',
}

export default async function AdminRestockPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const restocks = await getRestocks()

  return (
    <>
      <Header
        title="Barang Masuk (PO)"
        subtitle="Riwayat pembelian stok sparepart dari supplier"
      />
      <div className="p-6 animate-fade-in">
        <RestocksClient initialData={restocks} />
      </div>
    </>
  )
}
