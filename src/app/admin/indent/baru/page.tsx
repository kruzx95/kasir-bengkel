import Header from '@/components/layout/Header'
import NewIndentClient from './NewIndentClient'
import { getBranches } from '@/actions/branch'
import { getSpareparts } from '@/actions/sparepart'
import { getCustomers } from '@/actions/customer'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buat Pesanan Indent',
}

export default async function NewIndentPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const [branches, spareparts, customers] = await Promise.all([
    getBranches(),
    getSpareparts(),
    getCustomers(),
  ])

  return (
    <>
      <Header
        title="Buat Pesanan Indent"
        subtitle="Catat pemesanan sparepart yang belum tersedia dari supplier"
      />
      <div className="p-4 sm:p-6 animate-fade-in max-w-5xl mx-auto">
        <NewIndentClient branches={branches} spareparts={spareparts} customers={customers} />
      </div>
    </>
  )
}
