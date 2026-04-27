'use client'

import { useActionState, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createCustomer, updateCustomer, type CustomerState } from '@/actions/customer'
import { Save, UserPlus } from 'lucide-react'

interface CustomerData {
  id: string
  name: string
  phone: string | null
  plateNumber: string | null
  vehicleType: string | null
  vehicleYear: string | null
  branchId: string
}

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  branchId?: string
  editData?: CustomerData | null
}

export default function CustomerFormModal({
  open,
  onClose,
  branchId,
  editData,
}: CustomerFormModalProps) {
  const isEditing = !!editData

  const createAction = async (state: CustomerState, formData: FormData) => {
    return createCustomer(state, formData)
  }

  const updateAction = async (state: CustomerState, formData: FormData) => {
    return updateCustomer(editData!.id, state, formData)
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
      description={
        isEditing
          ? 'Perbarui data pelanggan'
          : 'Isi data pelanggan baru'
      }
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Hidden branchId for kasir */}
        {branchId && (
          <input type="hidden" name="branchId" value={branchId} />
        )}

        <Input
          id="name"
          name="name"
          label="Nama Pelanggan"
          placeholder="contoh: Ahmad Fauzi"
          defaultValue={editData?.name}
          error={state?.errors?.name?.[0]}
          required
        />

        <Input
          id="phone"
          name="phone"
          label="No. Telepon"
          placeholder="08xxxxxxxxxx"
          defaultValue={editData?.phone || ''}
        />

        <Input
          id="plateNumber"
          name="plateNumber"
          label="Plat Nomor"
          placeholder="contoh: Z 1234 ABC"
          defaultValue={editData?.plateNumber || ''}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="vehicleType"
            name="vehicleType"
            label="Tipe Kendaraan"
            placeholder="contoh: Honda Beat"
            defaultValue={editData?.vehicleType || ''}
          />

          <Input
            id="vehicleYear"
            name="vehicleYear"
            label="Tahun"
            placeholder="2024"
            defaultValue={editData?.vehicleYear || ''}
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={pending}
            icon={isEditing ? Save : UserPlus}
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
