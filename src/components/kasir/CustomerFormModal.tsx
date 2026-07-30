'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createCustomer, updateCustomer, type CustomerState } from '@/actions/customer'
import { Save, UserPlus, Building2, CheckCircle2 } from 'lucide-react'

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
    () => corporateList || [],
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
        {(isAdmin || corporateOptions.length > 0) && (
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
  const [selectedVal, setSelectedVal] = useState<string>(selectedId || '')

  useEffect(() => {
    setSelectedVal(selectedId || '')
  }, [selectedId])

  const selectedCorpName = useMemo(() => {
    return corporateList.find((c) => c.value === selectedVal)?.label
  }, [corporateList, selectedVal])

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-200 mb-4 ${
        selectedVal
          ? 'bg-blue-50/50 border-blue-200 shadow-xs'
          : 'bg-slate-50/60 border-slate-200/80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              selectedVal ? 'bg-blue-100 text-blue-600' : 'bg-slate-200/70 text-slate-600'
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <label
              htmlFor={name}
              className="block text-xs font-semibold text-slate-800 uppercase tracking-wider"
            >
              Pelanggan Korporat
            </label>
            <p className="text-[11px] text-slate-500">
              Pilih jika transaksi dijamin armada / perusahaan korporat
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
            selectedVal
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'bg-slate-200/60 text-slate-500'
          }`}
        >
          {selectedVal ? 'Korporat' : 'Individu'}
        </span>
      </div>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={selectedVal}
          onChange={(e) => setSelectedVal(e.target.value)}
          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%27http%3a%2f%2fwww.w3.org%2f2000%2fsvg%27%20width%3d%2712%27%20height%3d%2712%27%20viewBox%3d%270%200%2012%2012%27%3e%3cpath%20fill%3d%27%2394a3b8%27%20d%3d%27M2%204l4%204%204-4%27%2f%3e%3c%2fsvg%3e')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9 cursor-pointer"
        >
          <option value="">— Pelanggan Individu (Non-Korporat) —</option>
          {corporateList.map((corp) => (
            <option key={corp.value} value={corp.value}>
              🏢 {corp.label}
            </option>
          ))}
        </select>
      </div>

      {selectedVal && selectedCorpName && (
        <div className="mt-2.5 p-2 px-3 bg-blue-100/70 border border-blue-200/80 rounded-lg flex items-center gap-2 text-xs text-blue-900 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Pelanggan terhubung dengan korporat <strong className="font-semibold">{selectedCorpName}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
