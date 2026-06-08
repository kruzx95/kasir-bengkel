'use client'

import { useState, useTransition } from 'react'
import { Shield, Store, Mail, Edit2, Plus, Trash2, Crown } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { updateUser, createUser, deleteUser } from '@/actions/user'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  branch: { id: string; name: string } | null
}

interface BranchData {
  id: string
  name: string
}

export default function UsersClient({ users, branches }: { users: UserData[], branches: BranchData[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'KASIR',
    branchId: '',
  })
  const [error, setError] = useState('')

  const handleCreate = () => {
    setIsCreating(true)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'KASIR',
      branchId: branches[0]?.id || '',
    })
    setError('')
  }

  const handleEdit = (user: UserData) => {
    setIsCreating(false)
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      branchId: user.branch?.id || '',
    })
    setError('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return
    startTransition(async () => {
      const res = await deleteUser(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser && !isCreating) return
    setError('')

    if (isCreating && !formData.password) {
      setError('Password wajib diisi untuk pengguna baru')
      return
    }

    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 6) {
        setError('Password minimal 6 karakter')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Konfirmasi password tidak cocok')
        return
      }
    }

    startTransition(async () => {
      if (isCreating) {
        const res = await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as 'ADMIN' | 'KASIR',
          branchId: formData.branchId || null,
        })
        if (res.success) {
          setIsCreating(false)
          router.refresh()
        } else {
          setError(res.message || 'Terjadi kesalahan')
        }
      } else if (editingUser) {
        const res = await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
        })
        if (res.success) {
          setEditingUser(null)
          router.refresh()
        } else {
          setError(res.message || 'Terjadi kesalahan')
        }
      }
    })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button icon={Plus} onClick={handleCreate}>
          Tambah Pengguna
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group relative"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  user.role === 'ADMIN' && !user.branch
                    ? 'bg-linear-to-br from-violet-500 to-violet-700 shadow-violet-200'
                    : user.role === 'ADMIN'
                    ? 'bg-linear-to-br from-amber-400 to-amber-600 shadow-amber-200'
                    : 'bg-linear-to-br from-primary-400 to-primary-600 shadow-primary-200'
                }`}>
                  {user.role === 'ADMIN' && !user.branch ? (
                    <Crown className="w-5 h-5 text-white" />
                  ) : user.role === 'ADMIN' ? (
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
                  variant={user.role === 'ADMIN' && !user.branch ? 'primary' : user.role === 'ADMIN' ? 'warning' : 'info'}
                  size="md"
                >
                  {user.role === 'ADMIN' && !user.branch ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Kasir'}
                </Badge>
                
                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(user)}
                  className="ml-2 p-2 bg-white border border-slate-200 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary-600 hover:border-primary-200 shadow-sm"
                  title="Edit Pengguna"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={isPending}
                  className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:border-red-200 shadow-sm disabled:opacity-50"
                  title="Hapus Pengguna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!editingUser || isCreating}
        onClose={() => {
          setEditingUser(null)
          setIsCreating(false)
        }}
        title={isCreating ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
        description={isCreating ? "Buat akun akses untuk Super Admin atau Admin/Kasir toko." : (editingUser?.role === 'KASIR' ? `Kasir Cabang: ${editingUser?.branch?.name}` : (editingUser?.branch ? `Admin Toko: ${editingUser?.branch?.name}` : 'Super Admin Sistem'))}
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
            {isCreating && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Peran / Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { label: 'Kasir Cabang', value: 'KASIR' },
                    { label: 'Admin Sistem', value: 'ADMIN' },
                  ]}
                  required
                />
                <Select
                  label="Pilih Cabang (Kosongkan untuk Super Admin)"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  options={[
                    { label: formData.role === 'KASIR' ? 'Pilih Cabang...' : 'Akses Semua Cabang (Super Admin)', value: '' },
                    ...branches.map(b => ({ label: b.name, value: b.id }))
                  ]}
                  required={formData.role === 'KASIR'}
                />
              </div>
            )}
            <Input
              label={isCreating ? "Password" : "Password Baru"}
              type="password"
              placeholder={isCreating ? "Minimal 6 karakter" : "Kosongkan jika tidak ingin ganti password"}
              hint="Minimal 6 karakter jika diisi"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={isCreating}
            />
            {formData.password && (
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                placeholder="Ulangi password baru"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => {
              setEditingUser(null)
              setIsCreating(false)
            }}>
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
