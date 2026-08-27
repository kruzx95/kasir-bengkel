import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMemos } from '@/actions/memo'
import KasirMemoClient from './KasirMemoClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Memo Servis (SA)',
}

export default async function KasirMemoPage() {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const result = await getMemos({ branchId: session.branchId, limit: 100 })

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      <KasirMemoClient
        initialMemos={result.data as any}
        totalCount={result.totalCount}
        isAdmin={false}
      />
    </div>
  )
}
