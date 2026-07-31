import Header from '@/components/layout/Header'
import TagihanClient from '@/app/admin/korporat/[id]/tagihan/TagihanClient'
import { getCorporateCustomerById } from '@/actions/corporate'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import { getShopName } from '@/actions/settings'
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

  const branchId = corporate.branch.id

  const [allCustomers, services, spareparts, mechanics, shopName] = await Promise.all([
    getCustomers(branchId),
    getServices(branchId),
    getSpareparts(branchId),
    getMechanics(branchId),
    getShopName(),
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
          isAdmin={false}
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
          shopName={shopName}
        />
      </div>
    </>
  )
}
