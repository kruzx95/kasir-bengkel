import { getSession, isDemoUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import UsersClient from './UsersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Pengguna',
}

export default async function UsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/kasir')

  if (isDemoUser(session)) {
    redirect('/admin')
  }

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      include: { branch: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <>
      <Header
        title="Kelola Pengguna"
        subtitle="Daftar pengguna aplikasi"
      />
      <div className="p-4 sm:p-6 animate-fade-in">
        <p className="text-sm text-slate-500 mb-4">
          {users.length} pengguna aktif
        </p>

        <UsersClient users={users} branches={branches} />
      </div>
    </>
  )
}
