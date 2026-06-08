'use client'

import { useActionState, useEffect } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createSparepart, updateSparepart, type SparepartState } from '@/actions/sparepart'
import { Save, Plus } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
}

interface SparepartData {
  id: string
  name: string
  sku: string | null
  sparepartType: string | null
  sparepartBrand: string | null
  sparepartSize: string | null
  buyPrice: number
  sellPrice: number
  stock: number
  unit: string
  branchId: string
}

interface SparepartFormModalProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
  editData?: SparepartData | null
}

export default function SparepartFormModal({
  open,
  onClose,
  branches,
  editData,
}: SparepartFormModalProps) {
  const isEditing = !!editData

  const createAction = async (state: SparepartState, formData: FormData) => {
    return createSparepart(state, formData)
  }

  const updateAction = async (state: SparepartState, formData: FormData) => {
    return updateSparepart(editData!.id, state, formData)
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
      title={isEditing ? 'Edit Sparepart' : 'Tambah Sparepart'}
      description={
        isEditing
          ? 'Perbarui data sparepart'
          : 'Sparepart baru akan otomatis ditambahkan ke semua cabang'
      }
      size="lg"
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">

        {/* Identitas Sparepart */}
        <div className="pb-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Identitas Barang</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="name"
                name="name"
                label="Nama Sparepart"
                placeholder="contoh: Oli Yamalube 0.8L"
                defaultValue={editData?.name}
                error={state?.errors?.name?.[0]}
                required
              />
              <Input
                id="sku"
                name="sku"
                label="SKU / Kode Barang"
                placeholder="contoh: OLI-001"
                defaultValue={editData?.sku || ''}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="sparepartType"
                name="sparepartType"
                label="Jenis"
                placeholder="contoh: Oli, Filter, Busi"
                defaultValue={editData?.sparepartType || ''}
              />
              <Input
                id="sparepartBrand"
                name="sparepartBrand"
                label="Merk"
                placeholder="contoh: AHM, NGK, Yamalube"
                defaultValue={editData?.sparepartBrand || ''}
              />
              <Input
                id="sparepartSize"
                name="sparepartSize"
                label="Ukuran"
                placeholder="contoh: 20W-50, 17 inch"
                defaultValue={editData?.sparepartSize || ''}
              />
            </div>
          </div>
        </div>

        {/* Harga & Stok */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Harga & Stok</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="buyPrice"
                name="buyPrice"
                type="number"
                label="Harga Beli (Rp)"
                placeholder="28000"
                defaultValue={editData?.buyPrice?.toString()}
                error={state?.errors?.buyPrice?.[0]}
                required
              />
              <Input
                id="sellPrice"
                name="sellPrice"
                type="number"
                label="Harga Jual (Rp)"
                placeholder="38000"
                defaultValue={editData?.sellPrice?.toString()}
                error={state?.errors?.sellPrice?.[0]}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="stock"
                name="stock"
                type="number"
                label="Stok Awal"
                placeholder="50"
                defaultValue={editData?.stock?.toString() ?? '0'}
                error={state?.errors?.stock?.[0]}
                required
              />
              <Input
                id="unit"
                name="unit"
                label="Satuan"
                placeholder="pcs, botol, set"
                defaultValue={editData?.unit || 'pcs'}
                error={state?.errors?.unit?.[0]}
                required
              />
            </div>
          </div>
        </div>

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
            {isEditing ? 'Simpan Perubahan' : 'Tambah Sparepart'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
