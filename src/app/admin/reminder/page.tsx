import Header from '@/components/layout/Header'
import ReminderClient from './ReminderClient'
import { getCustomersDueForService } from '@/actions/reminder'
import { getBranches } from '@/actions/branch'
import { getShopName, getWaReminderTemplate } from '@/actions/settings'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reminder Servis',
}

export default async function ReminderPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  // Default to 3 months
  const defaultMonths = 3
  const [initialData, branches, shopName, waTemplate] = await Promise.all([
    getCustomersDueForService(defaultMonths),
    getBranches(),
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
          branches={branches}
          defaultMonths={defaultMonths}
          shopName={shopName}
          waTemplate={waTemplate}
        />
      </div>
    </>
  )
}
