import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMemos } from '@/actions/memo'
import KasirMemoClient from '@/app/kasir/memo/KasirMemoClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Memo Servis (SA)',
}

export default async function AdminMemoPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  const result = await getMemos({ limit: 100 })

  return (
    <div className="p-4 sm:p-6 animate-fade-in space-y-4">
      <KasirMemoClient
        initialMemos={result.data as any}
        totalCount={result.totalCount}
        isAdmin={true}
      />
    </div>
  )
}
