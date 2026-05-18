import Header from '@/components/layout/Header'
import IndentClient from './IndentClient'
import { getIndentOrders } from '@/actions/indent'
import { getBranches } from '@/actions/branch'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Indent',
}

export default async function AdminIndentPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const [indentOrders, branches] = await Promise.all([
    getIndentOrders(),
    getBranches(),
  ])

  return (
    <>
      <Header
        title="Barang Indent"
        subtitle="Kelola pemesanan sparepart yang belum diterima dari supplier"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <IndentClient initialData={indentOrders} branches={branches} />
      </div>
    </>
  )
}
