import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import PengaturanClient from './PengaturanClient'
import { getShopName } from '@/actions/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function PengaturanPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  const shopName = await getShopName()

  return (
    <>
      <Header title="Pengaturan" subtitle="Konfigurasi umum aplikasi" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <PengaturanClient shopName={shopName} />
      </div>
    </>
  )
}
