'use client'

import { useState, useTransition, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createMechanic, updateMechanic } from '@/actions/mechanic'
import { AlertTriangle } from 'lucide-react'

interface MechanicData {
  id: string
  name: string
  phone?: string | null
  branchId: string
  isActive: boolean
}

interface MechanicFormModalProps {
  isOpen: boolean
  onClose: () => void
  mechanic: MechanicData | null
  branches: { id: string; name: string }[]
  /**
   * ID cabang user. Jika diisi (admin-cabang / kasir), dropdown Cabang
   * disembunyikan dan mekanik otomatis terikat ke cabang tsb.
   * null = super-admin (lihat semua cabang & boleh pilih).
   */
  currentBranchId?: string | null
}

export default function MechanicFormModal({
  isOpen,
  onClose,
  mechanic,
  branches,
  currentBranchId,
}: MechanicFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isKasirMode = !!currentBranchId
  const lockedBranchId = currentBranchId ?? ''

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    branchId: '',
    isActive: true,
  })

  // Sinkronisasi state form saat modal dibuka/edit data berubah
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isKasirMode) {
      // Kasir / admin-cabang: branchId otomatis
      if (mechanic) {
        setFormData({
          name: mechanic.name,
          phone: mechanic.phone || '',
          branchId: mechanic.branchId,
          isActive: mechanic.isActive,
        })
      } else {
        setFormData({
          name: '',
          phone: '',
          branchId: lockedBranchId,
          isActive: true,
        })
      }
      setError('')
      return
    }

    // Super-admin: branchId dari dropdown
    if (mechanic) {
      setFormData({
        name: mechanic.name,
        phone: mechanic.phone || '',
        branchId: mechanic.branchId,
        isActive: mechanic.isActive,
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        branchId: branches[0]?.id ?? '',
        isActive: true,
      })
    }
    setError('')
  }, [mechanic, branches, isOpen, isKasirMode, lockedBranchId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Nama wajib diisi')
      return
    }
    if (!formData.branchId) {
      setError('Cabang wajib dipilih')
      return
    }

    startTransition(async () => {
      let res
      if (mechanic) {
        res = await updateMechanic(mechanic.id, {
          name: formData.name,
          phone: formData.phone,
          isActive: formData.isActive,
        })
      } else {
        res = await createMechanic({
          name: formData.name,
          phone: formData.phone,
          branchId: formData.branchId,
        })
      }

      if (res.success) {
        onClose()
      } else {
        setError(res.message || 'Terjadi kesalahan')
      }
    })
  }

  // Tampilkan warning hanya untuk super-admin jika tidak ada cabang aktif
  const showNoBranchWarning = !isKasirMode && branches.length === 0

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={mechanic ? 'Edit Mekanik' : 'Tambah Mekanik Baru'}
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {showNoBranchWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Tidak ada cabang aktif</div>
              <div className="text-xs mt-0.5">
                Tambahkan cabang terlebih dahulu di menu <strong>Cabang</strong>.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Nama Mekanik"
            placeholder="Contoh: Budi Santoso"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Nomor Telepon"
            placeholder="Opsional"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {/* Super-admin: tampilkan dropdown pilih cabang */}
          {!isKasirMode && branches.length > 0 && !mechanic && (
            <Select
              label="Cabang"
              options={branches.map(b => ({ label: b.name, value: b.id }))}
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              placeholder="Pilih cabang..."
              required
            />
          )}

          {/* Kasir / admin-cabang: hidden input + tampilkan info */}
          {isKasirMode && !mechanic && (
            <input type="hidden" name="branchId" value={lockedBranchId} />
          )}

          {mechanic && (
            <Select
              label="Status"
              options={[
                { label: 'Aktif', value: 'true' },
                { label: 'Nonaktif', value: 'false' },
              ]}
              value={formData.isActive.toString()}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            />
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={showNoBranchWarning}
          >
            {mechanic ? 'Simpan Perubahan' : 'Tambah Mekanik'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}