import Header from '@/components/layout/Header'
import { getSession } from '@/lib/session'
import { getCustomers } from '@/actions/customer'
import CustomersClient from './CustomersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar Pelanggan',
}

export default async function PelangganPage() {
  const session = await getSession()
  if (!session || !session.branchId) return null

  const customers = await getCustomers(session.branchId)

  return (
    <>
      <Header
        title="Daftar Pelanggan"
        subtitle={`Data pelanggan cabang ${session.branchName ?? ''}`}
      />
      <div className="p-6 animate-fade-in">
        <CustomersClient
          initialCustomers={customers as Parameters<typeof CustomersClient>[0]['initialCustomers']}
          branchId={session.branchId}
        />
      </div>
    </>
  )
}
