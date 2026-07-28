import Header from '@/components/layout/Header'
import ReceiveIndentClient from '@/app/admin/indent/[id]/terima/ReceiveIndentClient'
import { getIndentOrderById } from '@/actions/indent'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terima Barang Indent',
}

export default async function KasirReceiveIndentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const { id } = await params
  const indentOrder = await getIndentOrderById(id)
  if (!indentOrder) notFound()

  return (
    <>
      <Header
        title="Terima Barang Indent"
        subtitle={`Catat penerimaan barang dari ${indentOrder.supplierName}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in max-w-4xl mx-auto">
        <ReceiveIndentClient indentOrder={indentOrder} />
      </div>
    </>
  )
}
