'use client'

import { useState, useTransition } from 'react'
import { UserCog, Shield, Store, Mail, Edit2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateUser } from '@/actions/user'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  branch: { name: string } | null
}

export default function UsersClient({ users }: { users: UserData[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '' // Keep empty unless changing
    })
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError('')

    startTransition(async () => {
      const res = await updateUser(editingUser.id, formData)
      if (res.success) {
        setEditingUser(null)
        router.refresh()
      } else {
        setError(res.message || 'Terjadi kesalahan')
      }
    })
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group relative"
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
                
                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(user)}
                  className="ml-2 p-2 bg-white border border-slate-200 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary-600 hover:border-primary-200 shadow-sm"
                  title="Edit Pengguna"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Data Pengguna"
        description={editingUser?.role === 'KASIR' ? `Kasir Cabang: ${editingUser?.branch?.name}` : 'Admin Sistem'}
      >
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nama Pengguna"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Login"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Password Baru"
              type="password"
              placeholder="Kosongkan jika tidak ingin ganti password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              Simpan Perubahan
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
