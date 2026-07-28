import NewRestockClient from '@/app/admin/restock/baru/NewRestockClient'
import { getSpareparts } from '@/actions/sparepart'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barang Masuk Baru',
}

export default async function KasirNewRestockPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const spareparts = await getSpareparts()

  return (
    <NewRestockClient branches={[]} spareparts={spareparts} />
  )
}
