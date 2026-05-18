import { getRestockDetails } from '@/actions/restock'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import RestockDetailClient from './RestockDetailClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detail Barang Masuk',
}

export default async function RestockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const { id } = await params
  const restock = await getRestockDetails(id)

  if (!restock) notFound()

  return (
    <>
      <Header
        title="Detail Barang Masuk"
        subtitle={`PO dari ${restock.supplierName}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <RestockDetailClient restock={restock} />
      </div>
    </>
  )
}
