import Header from '@/components/layout/Header'
import MechanicsClient from './MechanicsClient'
import { getMechanics } from '@/actions/mechanic'
import { getBranches } from '@/actions/branch'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Master Mekanik',
}

export default async function MasterMechanicsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/kasir')
  }

  const mechanics = await getMechanics()
  const branches = await getBranches()

  return (
    <>
      <Header
        title="Master Mekanik"
        subtitle="Kelola data mekanik dan teknisi untuk setiap cabang"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <MechanicsClient initialData={mechanics} branches={branches} />
      </div>
    </>
  )
}
