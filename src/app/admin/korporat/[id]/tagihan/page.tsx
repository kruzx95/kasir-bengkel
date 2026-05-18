import Header from '@/components/layout/Header'
import TagihanClient from './TagihanClient'
import { getCorporateCustomerById } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { getCustomers } from '@/actions/customer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tagihan Korporat',
}

export default async function TagihanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  const { id } = await params
  const corporate = await getCorporateCustomerById(id)
  if (!corporate) notFound()

  // Get all customers for assignment management
  const allCustomers = await getCustomers(corporate.branch.id)

  return (
    <>
      <Header
        title={`Tagihan — ${corporate.name}`}
        subtitle={`Cabang ${corporate.branch.name} · Siklus ${corporate.billingCycle}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <TagihanClient corporate={corporate} allCustomers={allCustomers} />
      </div>
    </>
  )
}
