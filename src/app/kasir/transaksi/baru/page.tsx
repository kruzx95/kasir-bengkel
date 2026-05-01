import { getSession } from '@/lib/session'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import NewTransactionClient from './NewTransactionClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transaksi Baru',
}

export default async function TransaksiBaruPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  // Fetch necessary master data for the branch
  const [customers, services, spareparts, mechanics] = await Promise.all([
    getCustomers(session.branchId),
    getServices(session.branchId),
    getSpareparts(session.branchId),
    getMechanics(session.branchId),
  ])

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto">
      <NewTransactionClient
        customers={customers.map(c => ({ id: c.id, name: c.name, plateNumber: c.plateNumber }))}
        services={services.filter(s => s.isActive).map(s => ({ id: s.id, name: s.name, price: s.price }))}
        spareparts={spareparts.filter(sp => sp.isActive).map(sp => ({ 
          id: sp.id, 
          name: sp.name, 
          sellPrice: sp.sellPrice, 
          stock: sp.stock,
          sku: sp.sku
        }))}
        mechanics={mechanics.filter(m => m.isActive).map(m => ({ id: m.id, name: m.name }))}
      />
    </div>
  )
}
