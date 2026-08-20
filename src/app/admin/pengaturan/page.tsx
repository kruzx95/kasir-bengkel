import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import PengaturanClient from './PengaturanClient'
import { getShopName, getWaReminderTemplate } from '@/actions/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function PengaturanPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  const [shopName, waTemplate] = await Promise.all([
    getShopName(),
    getWaReminderTemplate(),
  ])

  return (
    <>
      <Header title="Pengaturan" subtitle="Konfigurasi umum dan template pesan aplikasi" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <PengaturanClient shopName={shopName} initialWaTemplate={waTemplate} />
      </div>
    </>
  )
}
