import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import DatabaseManagementClient from './DatabaseManagementClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manajemen Database' }

export default async function DatabaseManagementPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  return (
    <>
      <Header title="Manajemen Database" subtitle="Backup, Restore, dan Pembersihan Data Sistem" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <DatabaseManagementClient />
      </div>
    </>
  )
}
