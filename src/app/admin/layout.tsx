import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { getShopName } from '@/actions/settings'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  const shopName = await getShopName()

  return (
    <DashboardShell role="ADMIN" userName={session.name} branchName={session.branchName} shopName={shopName}>
      {children}
    </DashboardShell>
  )
}
