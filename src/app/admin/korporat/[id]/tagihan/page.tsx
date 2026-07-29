import Header from '@/components/layout/Header'
import TagihanClient from './TagihanClient'
import { getCorporateCustomerById } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tagihan Korporat',
}

export default async function TagihanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  const { id } = await params
  const corporate = await getCorporateCustomerById(id)
  if (!corporate) notFound()

  const branchId = corporate.branch.id

  // Fetch semua data yang dibutuhkan untuk service modal
  const [allCustomers, services, spareparts, mechanics] = await Promise.all([
    getCustomers(branchId),
    getServices(branchId),
    getSpareparts(branchId),
    getMechanics(branchId),
  ])

  return (
    <>
      <Header
        title={`Tagihan — ${corporate.name}`}
        subtitle={`Cabang ${corporate.branch.name} · Siklus ${corporate.billingCycle}`}
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <TagihanClient
          corporate={corporate}
          allCustomers={allCustomers}
          isAdmin={true}
          services={services.map(s => ({ id: s.id, name: s.name, price: s.price, category: s.category }))}
          spareparts={spareparts.map(s => ({
            id: s.id,
            name: s.name,
            sellPrice: s.sellPrice,
            stock: s.stock,
            unit: s.unit,
            sku: s.sku,
            sparepartBrand: s.sparepartBrand,
          }))}
          mechanics={mechanics.map(m => ({ id: m.id, name: m.name }))}
        />
      </div>
    </>
  )
}

