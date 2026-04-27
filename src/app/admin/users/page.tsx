import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import Badge from '@/components/ui/Badge'
import { UserCog, Shield, Store, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Pengguna',
}

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { branch: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return (
    <>
      <Header
        title="Kelola Pengguna"
        subtitle="Daftar pengguna aplikasi"
      />
      <div className="p-6 animate-fade-in">
        <p className="text-sm text-slate-500 mb-4">
          {users.length} pengguna aktif
        </p>

        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    user.role === 'ADMIN'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                      : 'bg-gradient-to-br from-primary-400 to-primary-600'
                  }`}>
                    {user.role === 'ADMIN' ? (
                      <Shield className="w-5 h-5 text-white" />
                    ) : (
                      <Store className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {user.branch && (
                    <Badge variant="primary" size="md">
                      {user.branch.name}
                    </Badge>
                  )}
                  <Badge
                    variant={user.role === 'ADMIN' ? 'warning' : 'info'}
                    size="md"
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Kasir'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
