import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Kasir',
}

export default async function KasirLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || session.role !== 'KASIR') {
    redirect('/login')
  }

  return (
    <DashboardShell
      role="KASIR"
      userName={session.name}
      branchName={session.branchName}
    >
      {children}
    </DashboardShell>
  )
}
