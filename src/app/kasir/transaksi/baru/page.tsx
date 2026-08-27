import { getSession } from '@/lib/session'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import { getCorporateCustomers } from '@/actions/corporate'
import NewTransactionClient from './NewTransactionClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transaksi Baru',
}

export default async function TransaksiBaruPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  // Fetch necessary master data for the branch
  const [customers, services, spareparts, mechanics, corporates] = await Promise.all([
    getCustomers(session.branchId),
    getServices(session.branchId),
    getSpareparts(session.branchId),
    getMechanics(session.branchId),
    getCorporateCustomers(session.branchId),
  ])

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-7xl mx-auto">
      <NewTransactionClient
        customers={customers.map(c => ({ id: c.id, name: c.name, plateNumber: c.plateNumber, corporateCustomerId: c.corporateCustomerId ?? null, odometer: c.odometer ?? null }))}
        services={services.filter(s => s.isActive).map(s => ({ id: s.id, name: s.name, price: s.price }))}
        spareparts={spareparts.filter(sp => sp.isActive).map(sp => ({ 
          id: sp.id, 
          name: sp.name, 
          sellPrice: sp.sellPrice, 
          buyPrice: sp.buyPrice ?? null,
          stock: sp.stock,
          sku: sp.sku,
          etalase: sp.etalase
        }))}
        mechanics={mechanics.filter(m => m.isActive).map(m => ({ id: m.id, name: m.name }))}
        corporates={corporates.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
