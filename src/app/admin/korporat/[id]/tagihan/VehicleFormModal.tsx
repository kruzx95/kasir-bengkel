'use client'

import { useActionState, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createCorporateVehicle, type CreateCorporateVehicleState } from '@/actions/corporate'
import { Car, Save } from 'lucide-react'

interface VehicleFormModalProps {
  open: boolean
  onClose: () => void
  corporateCustomerId: string
  branchId: string
  corporateName: string
  onSuccess?: () => void
}

export default function VehicleFormModal({
  open,
  onClose,
  corporateCustomerId,
  branchId,
  corporateName,
  onSuccess,
}: VehicleFormModalProps) {
  const boundAction = createCorporateVehicle.bind(null, corporateCustomerId, branchId)

  const [state, formAction, pending] = useActionState<CreateCorporateVehicleState, FormData>(
    boundAction,
    undefined
  )

  useEffect(() => {
    if (state?.success) {
      onSuccess?.()
      onClose()
    }
  }, [state?.success, onClose, onSuccess])

  const fuelTypeOptions = [
    { value: 'GASOLINE', label: 'Bensin (Gasoline)' },
    { value: 'DIESEL', label: 'Solar (Diesel)' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Kendaraan Korporat"
      description={`Tambah kendaraan baru ke ${corporateName}`}
      size="lg"
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Info PT */}
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
          <Car className="w-4 h-4 text-violet-500 shrink-0" />
          <p className="text-sm text-violet-700 font-medium">
            Kendaraan akan langsung terdaftar ke PT <span className="font-bold">{corporateName}</span>
          </p>
        </div>

        {/* Data Pemilik / Pengemudi */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Pengemudi / PIC</p>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nama Pengemudi / Nama Mobil"
              placeholder="contoh: Pak Budi / Avanza Operasional"
              error={state?.errors?.name?.[0]}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="phone"
                name="phone"
                label="No. Telepon"
                placeholder="08xxxxxxxxxx"
              />
              <Input
                id="plateNumber"
                name="plateNumber"
                label="Plat Nomor"
                placeholder="contoh: D 1234 ABC"
              />
            </div>
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
                placeholder="contoh: Toyota, Honda"
              />
              <Input
                id="vehicleType"
                name="vehicleType"
                label="Tipe / Model"
                placeholder="contoh: Avanza, Innova"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="vehicleColor"
                name="vehicleColor"
                label="Warna"
                placeholder="contoh: Putih, Hitam"
              />
              <Input
                id="vehicleYear"
                name="vehicleYear"
                label="Tahun"
                placeholder="2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="fuelType"
                name="fuelType"
                label="Jenis Bahan Bakar"
                options={fuelTypeOptions}
                placeholder="Pilih jenis BBM..."
              />
              <Input
                id="odometer"
                name="odometer"
                type="number"
                label="Odometer (km)"
                placeholder="contoh: 12500"
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={pending} icon={Save}>
            Tambah Kendaraan
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
