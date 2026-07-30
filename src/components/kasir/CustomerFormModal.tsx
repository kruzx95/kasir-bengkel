'use client'

import { useActionState, useEffect, useMemo } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createCustomer, updateCustomer, type CustomerState } from '@/actions/customer'
import { Save, UserPlus } from 'lucide-react'

interface CustomerData {
  id: string
  name: string
  phone: string | null
  address: string | null
  plateNumber: string | null
  vehicleBrand: string | null
  vehicleType: string | null
  vehicleColor: string | null
  vehicleYear: string | null
  fuelType: string | null
  odometer: number | null
  branchId: string
  corporateCustomerId?: string | null
}

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  branchId?: string
  editData?: CustomerData | null
  branches?: { id: string; name: string }[]
  isAdmin?: boolean
  corporateList?: Array<{ value: string; label: string }>
}

export default function CustomerFormModal({
  open,
  onClose,
  branchId,
  editData,
  branches,
  isAdmin = false,
  corporateList,
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

  const fuelTypeOptions = [
    { value: 'GASOLINE', label: 'Bensin (Gasoline)' },
    { value: 'DIESEL', label: 'Solar (Diesel)' },
  ]

  // Form key to reset when editData changes
  const formKey = useMemo(() => editData?.id ?? 'create', [editData?.id])

  // Corporate options (from parent or default)
  const corporateOptions = useMemo(
    () => [{ value: '', label: '— Individu —' }, ...(corporateList || [])],
    [corporateList]
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
      description={isEditing ? 'Perbarui data pelanggan' : 'Isi data pelanggan baru'}
      size="lg"
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Hidden branchId for kasir */}
        {branchId ? (
          <input type="hidden" name="branchId" value={branchId} />
        ) : branches && branches.length > 0 ? (
          <div className="mb-4">
            <Select
              id="branchId"
              name="branchId"
              label="Pilih Cabang"
              options={[
                { value: '', label: 'Pilih cabang...' },
                ...branches.map(b => ({ value: b.id, label: b.name }))
              ]}
              defaultValue={editData?.branchId || ''}
              required
            />
          </div>
        ) : null}

        {/* Corporate Customer Dropdown (Admin or Kasir with corporate options available) */}
        {(isAdmin || (corporateOptions && corporateOptions.length > 1)) && (
          <CorporateCustomerSelect
            key={`corp-${formKey}`}
            name="corporateCustomerId"
            corporateList={corporateOptions}
            selectedId={editData?.corporateCustomerId || null}
          />
        )}

        {/* Data Pemilik */}
        <div className="pb-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Pemilik</p>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nama Pelanggan"
              placeholder="contoh: Ahmad Fauzi"
              defaultValue={editData?.name}
              error={state?.errors?.name?.[0]}
              required
            />
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <Input
              id="address"
              name="address"
              label="Alamat"
              placeholder="contoh: Jl. Merdeka No. 10, Tasikmalaya"
              defaultValue={editData?.address || ''}
            />
          </div>
        </div>

        {/* Data Kendaraan */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Kendaraan</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="vehicleBrand"
                name="vehicleBrand"
                label="Merk"
                placeholder="contoh: Honda, Yamaha"
                defaultValue={editData?.vehicleBrand || ''}
              />
              <Input
                id="vehicleType"
                name="vehicleType"
                label="Tipe / Model"
                placeholder="contoh: Beat, Vario"
                defaultValue={editData?.vehicleType || ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="vehicleColor"
                name="vehicleColor"
                label="Warna"
                placeholder="contoh: Merah, Hitam"
                defaultValue={editData?.vehicleColor || ''}
              />
              <Input
                id="vehicleYear"
                name="vehicleYear"
                label="Tahun"
                placeholder="2024"
                defaultValue={editData?.vehicleYear || ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="fuelType"
                name="fuelType"
                label="Jenis Bahan Bakar"
                options={fuelTypeOptions}
                placeholder="Pilih jenis BBM..."
                defaultValue={editData?.fuelType || ''}
              />
              <Input
                id="odometer"
                name="odometer"
                type="number"
                label="Odometer (km)"
                placeholder="contoh: 12500"
                defaultValue={editData?.odometer?.toString() || ''}
              />
            </div>
          </div>
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

// ============================================================
// Corporate Customer Select (internal component)
// ============================================================

function CorporateCustomerSelect({
  name,
  corporateList,
  selectedId,
}: {
  name: string
  corporateList: Array<{ value: string; label: string }>
  selectedId: string | null
}) {
  return (
    <div className="mb-4">
      <Select
        id={name}
        name={name}
        label="Pelanggan Korporat (Opsional)"
        options={[
          { value: '', label: '— Individu —' },
          ...corporateList,
        ]}
        defaultValue={selectedId || ''}
        placeholder="Pilih korporat..."
      />
    </div>
  )
}
