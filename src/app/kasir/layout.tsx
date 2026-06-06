import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { getShopName } from '@/actions/settings'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard Kasir',
}

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'KASIR') redirect('/login')

  const shopName = await getShopName()

  return (
    <DashboardShell role="KASIR" userName={session.name} branchName={session.branchName} shopName={shopName}>
      {children}
    </DashboardShell>
  )
}
