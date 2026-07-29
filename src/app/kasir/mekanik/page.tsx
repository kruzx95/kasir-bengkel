import Header from '@/components/layout/Header'
import MechanicsClient from '@/app/admin/master/mechanics/MechanicsClient'
import { getMechanics } from '@/actions/mechanic'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mekanik',
}

export default async function KasirMekanikPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const mechanics = await getMechanics()

  return (
    <>
      <Header
        title="Mekanik"
        subtitle="Kelola data mekanik dan teknisi cabang Anda"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <MechanicsClient
          initialData={mechanics}
          branches={[]}
          currentBranchId={session.branchId}
        />
      </div>
    </>
  )
}
