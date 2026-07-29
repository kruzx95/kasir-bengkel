import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getCustomers } from '@/actions/customer'
import { getServices } from '@/actions/service'
import { getSpareparts } from '@/actions/sparepart'
import { getMechanics } from '@/actions/mechanic'
import { getCorporateCustomers } from '@/actions/corporate'
import AdminNewTransactionClient from './AdminNewTransactionClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Transaksi Baru',
}

export default async function AdminTransaksiBaruPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null

  const isSuperAdmin = !session.branchId
  if (isSuperAdmin) {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return (
      <div className="p-4 sm:p-6 animate-fade-in max-w-7xl mx-auto">
        <AdminNewTransactionClient branches={branches} />
      </div>
    )
  }

  // If Admin Toko, fetch data directly for their branch
  const branchId = session.branchId!
  const [c, s, sp, m, corp] = await Promise.all([
    getCustomers(branchId),
    getServices(branchId),
    getSpareparts(branchId),
    getMechanics(branchId),
    getCorporateCustomers(branchId),
  ])

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-7xl mx-auto">
      <AdminNewTransactionClient 
        branches={[]} 
        preloadedData={{ customers: c, services: s, spareparts: sp, mechanics: m, corporates: corp, branchId }} 
      />
    </div>
  )
}
