import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
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
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role="KASIR"
        userName={session.name}
        branchName={session.branchName}
      />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
