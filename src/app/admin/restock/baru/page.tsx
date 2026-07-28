import NewRestockClient from './NewRestockClient'
import { getBranches } from '@/actions/branch'
import { getSpareparts } from '@/actions/sparepart'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Masuk Baru',
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
    <NewRestockClient branches={branches} spareparts={spareparts} />
  )
}
