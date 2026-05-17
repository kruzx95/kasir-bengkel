import Header from '@/components/layout/Header'
import NewRestockClient from './NewRestockClient'
import { getBranches } from '@/actions/branch'
import { getSpareparts } from '@/actions/sparepart'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catat Barang Masuk',
}

export default async function AdminNewRestockPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const [branches, spareparts] = await Promise.all([
    getBranches(),
    getSpareparts() // Admin gets all spareparts from all branches
  ])

  return (
    <>
      <Header
        title="Catat Barang Masuk"
        subtitle="Input PO baru untuk menambah stok sparepart di cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in max-w-5xl mx-auto">
        <NewRestockClient branches={branches} spareparts={spareparts} />
      </div>
    </>
  )
}
