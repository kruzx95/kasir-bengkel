import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <DashboardShell
      role="ADMIN"
      userName={session.name}
      branchName={session.branchName}
    >
      {children}
    </DashboardShell>
  )
}
