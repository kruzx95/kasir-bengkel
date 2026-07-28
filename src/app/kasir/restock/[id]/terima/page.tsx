import Header from '@/components/layout/Header'
import ReceiveRestockClient from '@/app/admin/restock/[id]/terima/ReceiveRestockClient'
import { getIndentOrderById } from '@/actions/indent'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terima Barang Restock',
}

export default async function KasirReceiveRestockPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const { id } = await params
  const order = await getIndentOrderById(id)
  if (!order) notFound()

  return (
    <>
      <Header
        title="Terima PO Barang Masuk"
        subtitle={`Penerimaan stok dari supplier ${order.supplierName}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in max-w-5xl mx-auto">
        <ReceiveRestockClient order={order} />
      </div>
    </>
  )
}
