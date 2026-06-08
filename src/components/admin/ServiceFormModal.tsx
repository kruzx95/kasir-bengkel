'use client'

import { useActionState, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createService, updateService, type ServiceState } from '@/actions/service'
import { Save, Plus } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
}

interface ServiceData {
  id: string
  name: string
  price: number
  category: string | null
  branchId: string
}

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
  editData?: ServiceData | null
}

export default function ServiceFormModal({
  open,
  onClose,
  branches,
  editData,
}: ServiceFormModalProps) {
  const isEditing = !!editData

  const createAction = async (state: ServiceState, formData: FormData) => {
    return createService(state, formData)
  }

  const updateAction = async (state: ServiceState, formData: FormData) => {
    return updateService(editData!.id, state, formData)
  }

  const [state, formAction, pending] = useActionState(
    isEditing ? updateAction : createAction,
    undefined
  )

  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Jasa Servis' : 'Tambah Jasa Servis'}
      description={
        isEditing
          ? 'Perbarui data jasa servis'
          : 'Servis baru akan otomatis ditambahkan ke semua cabang'
      }
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          id="name"
          name="name"
          label="Nama Servis"
          placeholder="contoh: Ganti Oli"
          defaultValue={editData?.name}
          error={state?.errors?.name?.[0]}
          required
        />

        <Input
          id="price"
          name="price"
          type="number"
          label="Harga (Rp)"
          placeholder="50000"
          defaultValue={editData?.price?.toString()}
          error={state?.errors?.price?.[0]}
          required
        />

        <Input
          id="category"
          name="category"
          label="Kategori"
          placeholder="contoh: Perawatan, Rem, Mesin"
          defaultValue={editData?.category || ''}
        />

        {isEditing && branches.length > 0 && (
          <Select
            id="branchId"
            name="branchId"
            label="Cabang"
            options={branchOptions}
            placeholder="Pilih cabang..."
            defaultValue={editData?.branchId}
            required
          />
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={pending}
            icon={isEditing ? Save : Plus}
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Servis'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
