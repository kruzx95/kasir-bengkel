import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getMemos } from '@/actions/memo'
import MekanikDashboardClient from './MekanikDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal Mekanik & Service Advisor',
}

export default async function MekanikPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await getMemos({ limit: 100 })

  return (
    <MekanikDashboardClient
      initialMemos={result.data as any}
      totalCount={result.totalCount}
    />
  )
}
