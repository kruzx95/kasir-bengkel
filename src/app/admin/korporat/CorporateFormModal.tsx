'use client'

import { useActionState, useEffect, useMemo } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { createCorporateCustomer, updateCorporateCustomer, type CorporateState } from '@/actions/corporate'
import { Save, Plus } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
  isActive?: boolean
}

interface CorporateData {
  id: string
  name: string
  contactPerson: string | null
  contactPhone: string | null
  address?: string | null
  taxId?: string | null
  billingCycle: string
  branch: { name: string }
  branchId?: string | null
  hideServiceOnInvoice?: boolean
}

interface CorporateFormModalProps {
  open: boolean
  onClose: () => void
  branches?: Branch[]
  editData?: CorporateData | null
  /**
   * ID cabang user (kasir). Jika diisi, dropdown cabang disembunyikan dan
   * otomatis terikat ke cabang tsb (kasir hanya boleh buat korporat di cabangnya).
   */
  currentBranchId?: string | null
}

export default function CorporateFormModal({
  open,
  onClose,
  branches,
  editData,
  currentBranchId,
}: CorporateFormModalProps) {
  const isEditing = !!editData

  // Mode kasir: cabang otomatis terikat ke cabang user, tidak ditampilkan di UI
  const isKasirMode = !!currentBranchId
  const lockedBranchId = currentBranchId ?? ''

  const createAction = async (state: CorporateState, formData: FormData) =>
    createCorporateCustomer(state, formData)

  const updateAction = async (state: CorporateState, formData: FormData) =>
    updateCorporateCustomer(editData!.id, state, formData)

  const [state, formAction, pending] = useActionState(
    isEditing ? updateAction : createAction,
    undefined
  )

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  // Derive a form key that changes when editData changes (forces form remount/reset)
  const formKey = useMemo(() => editData?.id ?? 'create', [editData?.id])

  const billingOptions = [
    { value: 'WEEKLY', label: 'Mingguan' },
    { value: 'BIWEEKLY', label: 'Dua Mingguan' },
    { value: 'MONTHLY', label: 'Bulanan' },
  ]

  const branchOptions = useMemo(
    () => (branches ?? []).map(b => ({ value: b.id, label: `${b.name} (${b.code})` })),
    [branches]
  )

  // Default branchId for create mode: prefer first active branch
  const defaultBranchId =
    isEditing && editData?.branchId
      ? editData.branchId
      : branches?.[0]?.id ?? ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Pelanggan Korporat' : 'Tambah Pelanggan Korporat'}
      description="Data perusahaan/instansi dengan sistem tagihan borongan"
      size="lg"
    >
      {state?.message && !state.success && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="pb-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Perusahaan</p>
          <div className="space-y-4">
            <Input
              name="name" label="Nama Perusahaan" required
              placeholder="contoh: PT. Maju Bersama"
              defaultValue={editData?.name}
              error={state?.errors?.name?.[0]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="contactPerson" label="Nama Kontak"
                placeholder="contoh: Budi Santoso"
                defaultValue={editData?.contactPerson || ''}
              />
              <Input
                name="contactPhone" label="No. Telepon Kontak"
                placeholder="08xxxxxxxxxx"
                defaultValue={editData?.contactPhone || ''}
              />
            </div>
            <Input
              name="address" label="Alamat"
              placeholder="Alamat perusahaan"
              defaultValue={editData?.address ?? ''}
            />
            <Input
              name="taxId" label="NPWP (Opsional)"
              placeholder="xx.xxx.xxx.x-xxx.xxx"
              defaultValue={editData?.taxId ?? ''}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pengaturan Tagihan</p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="billingCycle" label="Siklus Tagihan"
              options={billingOptions}
              defaultValue={editData?.billingCycle || 'MONTHLY'}
            />
            {isKasirMode ? (
              <input type="hidden" name="branchId" value={lockedBranchId} />
            ) : (
              <Select
                key={`branch-${formKey}`}
                name="branchId" label="Cabang" required
                options={branchOptions}
                placeholder="Pilih cabang..."
                defaultValue={defaultBranchId}
              />
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pengaturan Invoice</p>
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              name="hideServiceOnInvoice"
              defaultChecked={editData?.hideServiceOnInvoice ?? false}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">Sembunyikan Jasa di Invoice</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Item jasa (servis) tidak akan muncul di invoice/cetak piutang korporat.
                Sparepart tetap tampil dengan harga normal.
              </div>
            </div>
          </label>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button
            type="submit"
            loading={pending}
            disabled={!isKasirMode && branchOptions.length === 0}
            icon={isEditing ? Save : Plus}
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Korporat'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}