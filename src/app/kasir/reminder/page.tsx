import Header from '@/components/layout/Header'
import ReminderClient from '@/app/admin/reminder/ReminderClient'
import { getCustomersDueForService } from '@/actions/reminder'
import { getShopName, getWaReminderTemplate } from '@/actions/settings'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reminder Servis',
}

export default async function KasirReminderPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const defaultMonths = 3
  const [initialData, shopName, waTemplate] = await Promise.all([
    getCustomersDueForService(defaultMonths),
    getShopName(),
    getWaReminderTemplate(),
  ])

  return (
    <>
      <Header
        title="Reminder Servis"
        subtitle="Follow-up pelanggan yang sudah waktunya servis berkala"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ReminderClient
          initialData={initialData}
          branches={[]}
          defaultMonths={defaultMonths}
          shopName={shopName}
          waTemplate={waTemplate}
        />
      </div>
    </>
  )
}
