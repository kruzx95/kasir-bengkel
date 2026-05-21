import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ProfilClient from './ProfilClient'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profil & Keamanan' }

export default async function ProfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, branch: { select: { name: true } } },
  })
  if (!user) redirect('/login')

  return (
    <>
      <Header title="Profil & Keamanan" subtitle="Kelola informasi akun dan password Anda" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ProfilClient user={user} />
      </div>
    </>
  )
}
