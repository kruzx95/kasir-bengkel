import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { getShopName } from '@/actions/settings'

export default async function ProfilLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const shopName = await getShopName()

  return (
    <DashboardShell
      role={session.role as 'ADMIN' | 'KASIR'}
      userName={session.name}
      branchName={session.branchName}
      shopName={shopName}
    >
      {children}
    </DashboardShell>
  )
}
