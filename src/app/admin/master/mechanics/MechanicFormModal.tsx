'use client'

import { useState, useTransition, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createMechanic, updateMechanic } from '@/actions/mechanic'

interface MechanicFormModalProps {
  isOpen: boolean
  onClose: () => void
  mechanic: any | null
  branches: { id: string; name: string }[]
}

export default function MechanicFormModal({ isOpen, onClose, mechanic, branches }: MechanicFormModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    branchId: '',
    isActive: true,
  })

  useEffect(() => {
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
        branchId: branches[0]?.id || '',
        isActive: true,
      })
    }
    setError('')
  }, [mechanic, branches, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.branchId) {
      setError('Nama dan Cabang wajib diisi')
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

          {!mechanic && (
            <Select
              label="Cabang"
              options={branches.map(b => ({ label: b.name, value: b.id }))}
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
            />
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
          <Button type="submit" loading={isPending}>
            {mechanic ? 'Simpan Perubahan' : 'Tambah Mekanik'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
