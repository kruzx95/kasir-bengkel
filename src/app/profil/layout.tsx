import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function ProfilLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <DashboardShell
      role={session.role as 'ADMIN' | 'KASIR'}
      userName={session.name}
      branchName={session.branchName}
    >
      {children}
    </DashboardShell>
  )
}
