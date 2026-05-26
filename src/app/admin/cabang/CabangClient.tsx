'use client'

import { useState, useTransition } from 'react'
import { Building2, MapPin, Phone, CheckCircle, Edit2, Plus, Trash2 } from 'lucide-react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { updateBranch, createBranch, deleteBranch } from '@/actions/branch'
import { useRouter } from 'next/navigation'

interface Branch {
  id: string
  code: string
  name: string
  address: string
  phone: string | null
  instagramHandle: string | null
  facebookPage: string | null
  whatsappNumber: string | null
}

const branchColors = ['from-emerald-500 to-emerald-600', 'from-blue-500 to-blue-600', 'from-violet-500 to-violet-600']

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}export default function CabangClient({ branches }: { branches: Branch[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    instagramHandle: '',
    facebookPage: '',
    whatsappNumber: '',
  })
  const [error, setError] = useState('')

  const handleCreate = () => {
    setIsCreating(true)
    setEditingBranch(null)
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      instagramHandle: '',
      facebookPage: '',
      whatsappNumber: '',
    })
    setError('')
  }

  const handleEdit = (branch: Branch) => {
    setIsCreating(false)
    setEditingBranch(branch)
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      instagramHandle: branch.instagramHandle || '',
      facebookPage: branch.facebookPage || '',
      whatsappNumber: branch.whatsappNumber || '',
    })
    setError('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Yakin ingin menghapus / menonaktifkan cabang ini?')) return
    startTransition(async () => {
      const res = await deleteBranch(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBranch && !isCreating) return
    setError('')

    startTransition(async () => {
      if (isCreating) {
        const res = await createBranch({ ...formData })
        if (res.success) {
          setIsCreating(false)
          router.refresh()
        } else {
          setError(res.message || 'Terjadi kesalahan')
        }
      } else if (editingBranch) {
        const res = await updateBranch(editingBranch.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          instagramHandle: formData.instagramHandle,
          facebookPage: formData.facebookPage,
          whatsappNumber: formData.whatsappNumber,
        })
        if (res.success) {
          setEditingBranch(null)
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
          Tambah Cabang
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 relative group"
          >
            <div className={`h-2 bg-linear-to-r ${branchColors[index % 3]}`} />

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-linear-to-br ${branchColors[index % 3]} rounded-xl flex items-center justify-center`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{branch.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{branch.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-700">Aktif</span>
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

              {/* Social Media */}
              {(branch.instagramHandle || branch.facebookPage || branch.whatsappNumber) && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {branch.instagramHandle && (
                    <span className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                      <InstagramIcon className="w-3 h-3" />
                      @{branch.instagramHandle}
                    </span>
                  )}
                  {branch.facebookPage && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      <FacebookIcon className="w-3 h-3" />
                      {branch.facebookPage}
                    </span>
                  )}
                  {branch.whatsappNumber && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <WhatsAppIcon className="w-3 h-3" />
                      {branch.whatsappNumber}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(branch)}
                className="p-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-lg hover:text-primary-600 hover:border-primary-200 shadow-sm"
                title="Edit Data Cabang"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(branch.id)}
                disabled={isPending}
                className="p-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-600 rounded-lg hover:text-red-600 hover:border-red-200 shadow-sm disabled:opacity-50"
                title="Hapus Cabang"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!editingBranch || isCreating}
        onClose={() => {
          setEditingBranch(null)
          setIsCreating(false)
        }}
        title={isCreating ? "Tambah Cabang Baru" : "Edit Data Cabang"}
      >
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isCreating && (
              <Input
                label="Kode Cabang"
                placeholder="Contoh: BRG-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            )}
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

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Media Sosial <span className="font-normal normal-case text-slate-400">(opsional)</span>
              </p>
              <div className="space-y-3">
                <Input
                  label="Instagram"
                  placeholder="username tanpa @"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                />
                <Input
                  label="Facebook"
                  placeholder="nama halaman Facebook"
                  value={formData.facebookPage}
                  onChange={(e) => setFormData({ ...formData, facebookPage: e.target.value })}
                />
                <Input
                  label="WhatsApp"
                  placeholder="contoh: 6281234567890 (tanpa +)"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  hint="Format: angka saja, 10–15 digit"
                />
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => {
              setEditingBranch(null)
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
