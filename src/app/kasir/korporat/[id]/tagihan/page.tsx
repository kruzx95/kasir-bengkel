import Header from '@/components/layout/Header'
import TagihanClient from '@/app/admin/korporat/[id]/tagihan/TagihanClient'
import { getCorporateCustomerById } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { getCustomers } from '@/actions/customer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tagihan Korporat',
}

export default async function KasirTagihanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const { id } = await params
  const corporate = await getCorporateCustomerById(id)
  if (!corporate) notFound()

  const allCustomers = await getCustomers(corporate.branch.id)

  return (
    <>
      <Header
        title={`Tagihan — ${corporate.name}`}
        subtitle={`Cabang ${corporate.branch.name} · Siklus ${corporate.billingCycle}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <TagihanClient corporate={corporate} allCustomers={allCustomers} isAdmin={false} />
      </div>
    </>
  )
}
