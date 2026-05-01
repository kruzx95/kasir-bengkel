'use client'

import { useState, useTransition } from 'react'
import { Building2, MapPin, Phone, CheckCircle, Edit2 } from 'lucide-react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateBranch } from '@/actions/branch'
import { useRouter } from 'next/navigation'

interface Branch {
  id: string
  code: string
  name: string
  address: string
  phone: string | null
}

const branchColors = ['from-emerald-500 to-emerald-600', 'from-blue-500 to-blue-600', 'from-violet-500 to-violet-600']

export default function CabangClient({ branches }: { branches: Branch[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  })
  const [error, setError] = useState('')

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || ''
    })
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBranch) return
    setError('')

    startTransition(async () => {
      const res = await updateBranch(editingBranch.id, formData)
      if (res.success) {
        setEditingBranch(null)
        router.refresh()
      } else {
        setError(res.message || 'Terjadi kesalahan')
      }
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 relative group"
          >
            <div className={`h-2 bg-gradient-to-r ${branchColors[index % 3]}`} />

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${branchColors[index % 3]} rounded-xl flex items-center justify-center`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{branch.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{branch.code}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-medium text-emerald-700">Aktif</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{branch.address}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Overlay Button */}
            <button
              onClick={() => handleEdit(branch)}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary-600 hover:border-primary-200 shadow-sm"
              title="Edit Data Cabang"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        title="Edit Data Cabang"
      >
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nama Cabang"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Alamat Lengkap"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <Input
              label="Nomor Telepon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setEditingBranch(null)}>
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
