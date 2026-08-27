import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getShopName } from '@/actions/settings'
import MekanikHeader from '@/components/mekanik/MekanikHeader'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Portal Mekanik & Service Advisor',
}

export default async function MekanikLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const shopName = await getShopName()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white print:min-h-0">
      <MekanikHeader
        userName={session.name}
        userRole={session.role}
        branchName={session.branchName}
        shopName={shopName}
        isDemo={session.isDemo}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  )
}
