'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car,
  User,
  Wrench,
  Package,
  ClipboardCheck,
  Plus,
  Trash2,
  Save,
  Printer,
  ArrowLeft,
  Clock,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  TUNE_UP_ITEMS,
  BRAKES_ITEMS,
  SUSPENSION_ITEMS,
  ChecklistTuneUp,
  ChecklistBrakes,
  ChecklistSuspension,
} from '@/lib/memo-constants'
import { createMemo, updateMemo } from '@/actions/memo'

interface MechanicOption {
  id: string
  name: string
  phone?: string | null
}

interface ServiceOption {
  id: string
  name: string
  price: number
}

interface SparepartOption {
  id: string
  name: string
  sellPrice: number
  stock: number
  unit: string
}

interface MemoFormProps {
  initialData?: any
  mechanics: MechanicOption[]
  availableServices?: ServiceOption[]
  availableSpareparts?: SparepartOption[]
  isEdit?: boolean
  basePath?: string
}

export default function MemoForm({
  initialData,
  mechanics = [],
  availableServices = [],
  availableSpareparts = [],
  isEdit = false,
  basePath = '/mekanik',
}: MemoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Form states
  const [queueNumber, setQueueNumber] = useState(initialData?.queueNumber || '')
  const [customerName, setCustomerName] = useState(initialData?.customerName || '')
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '')
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '')
  const [vehiclePlate, setVehiclePlate] = useState(initialData?.vehiclePlate || '')
  const [vehicleModel, setVehicleModel] = useState(initialData?.vehicleModel || '')
  const [odometer, setOdometer] = useState(initialData?.odometer ? String(initialData.odometer) : '')
  const [mechanicId, setMechanicId] = useState(initialData?.mechanicId || '')
  const [complaints, setComplaints] = useState(initialData?.complaints || '')
  const [initialDiagnosis, setInitialDiagnosis] = useState(initialData?.initialDiagnosis || '')
  const [estimatedDuration, setEstimatedDuration] = useState(initialData?.estimatedDuration || '')
  const [notes, setNotes] = useState(initialData?.notes || '')

  // Checklists
  const [tuneUp, setTuneUp] = useState<Record<string, boolean>>(
    initialData?.checklistTuneUp || {}
  )
  const [brakes, setBrakes] = useState<Record<string, boolean>>(
    initialData?.checklistBrakes || {}
  )
  const [suspension, setSuspension] = useState<Record<string, boolean>>(
    initialData?.checklistSuspension || {}
  )

  // Dynamic Service rows (1-10)
  const [services, setServices] = useState<
    Array<{ serviceId?: string; name: string; estimatedPrice: number; notes: string }>
  >(
    initialData?.services?.length
      ? initialData.services.map((s: any) => ({
          serviceId: s.serviceId || '',
          name: s.name,
          estimatedPrice: s.estimatedPrice || 0,
          notes: s.notes || '',
        }))
      : [{ serviceId: '', name: '', estimatedPrice: 0, notes: '' }]
  )

  // Dynamic Sparepart rows (1-10)
  const [spareparts, setSpareparts] = useState<
    Array<{ sparepartId?: string; name: string; quantity: number; unit: string; estimatedPrice: number; notes: string }>
  >(
    initialData?.spareparts?.length
      ? initialData.spareparts.map((sp: any) => ({
          sparepartId: sp.sparepartId || '',
          name: sp.name,
          quantity: sp.quantity || 1,
          unit: sp.unit || 'pcs',
          estimatedPrice: sp.estimatedPrice || 0,
          notes: sp.notes || '',
        }))
      : [{ sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, notes: '' }]
  )

  // Handlers for Checklist toggles
  const toggleTuneUp = (key: string) => {
    setTuneUp((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleBrakes = (key: string) => {
    setBrakes((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleSuspension = (key: string) => {
    setSuspension((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const setAllTuneUp = (value: boolean) => {
    const next: Record<string, boolean> = {}
    TUNE_UP_ITEMS.forEach((item) => {
      next[item.key] = value
    })
    setTuneUp(next)
  }

  const setAllBrakes = (value: boolean) => {
    const next: Record<string, boolean> = {}
    BRAKES_ITEMS.forEach((item) => {
      next[item.key] = value
    })
    setBrakes(next)
  }

  const setAllSuspension = (value: boolean) => {
    const next: Record<string, boolean> = {}
    SUSPENSION_ITEMS.forEach((item) => {
      next[item.key] = value
    })
    setSuspension(next)
  }

  // Service Row helpers
  const addServiceRow = () => {
    if (services.length < 10) {
      setServices([...services, { serviceId: '', name: '', estimatedPrice: 0, notes: '' }])
    }
  }
  const removeServiceRow = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    } else {
      setServices([{ serviceId: '', name: '', estimatedPrice: 0, notes: '' }])
    }
  }
  const updateServiceRow = (index: number, field: string, value: any) => {
    const next = [...services]
    next[index] = { ...next[index], [field]: value }
    setServices(next)
  }
  const selectMasterService = (index: number, serviceId: string) => {
    const found = availableServices.find((s) => s.id === serviceId)
    if (found) {
      const next = [...services]
      next[index] = {
        ...next[index],
        serviceId: found.id,
        name: found.name,
        estimatedPrice: found.price,
      }
      setServices(next)
    }
  }

  // Sparepart Row helpers
  const addSparepartRow = () => {
    if (spareparts.length < 10) {
      setSpareparts([...spareparts, { sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, notes: '' }])
    }
  }
  const removeSparepartRow = (index: number) => {
    if (spareparts.length > 1) {
      setSpareparts(spareparts.filter((_, i) => i !== index))
    } else {
      setSpareparts([{ sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, notes: '' }])
    }
  }
  const updateSparepartRow = (index: number, field: string, value: any) => {
    const next = [...spareparts]
    next[index] = { ...next[index], [field]: value }
    setSpareparts(next)
  }
  const selectMasterSparepart = (index: number, sparepartId: string) => {
    const found = availableSpareparts.find((sp) => sp.id === sparepartId)
    if (found) {
      const next = [...spareparts]
      next[index] = {
        ...next[index],
        sparepartId: found.id,
        name: found.name,
        unit: found.unit || 'pcs',
        estimatedPrice: found.sellPrice,
      }
      setSpareparts(next)
    }
  }

  const handleSubmit = (andPrint = false) => {
    if (!customerName.trim()) {
      setError('Nama pelanggan wajib diisi.')
      return
    }
    if (!vehiclePlate.trim()) {
      setError('Nomor polisi (plat) kendaraan wajib diisi.')
      return
    }

    setError('')
    startTransition(async () => {
      const payload = {
        queueNumber,
        customerName,
        customerPhone,
        customerAddress,
        vehiclePlate,
        vehicleModel,
        odometer: odometer ? parseInt(odometer, 10) : null,
        mechanicId: mechanicId || null,
        complaints,
        initialDiagnosis,
        estimatedDuration,
        notes,
        checklistTuneUp: tuneUp as ChecklistTuneUp,
        checklistBrakes: brakes as ChecklistBrakes,
        checklistSuspension: suspension as ChecklistSuspension,
        services: services.filter((s) => s.name.trim().length > 0),
        spareparts: spareparts.filter((sp) => sp.name.trim().length > 0),
      }

      if (isEdit && initialData?.id) {
        const res = await updateMemo(initialData.id, payload)
        if (res.success) {
          if (andPrint) {
            router.push(`/cetak-memo/${initialData.id}`)
          } else {
            router.push(basePath)
          }
        } else {
          setError(res.message)
        }
      } else {
        const res = await createMemo(payload)
        if (res.success && res.memoId) {
          if (andPrint) {
            router.push(`/cetak-memo/${res.memoId}`)
          } else {
            router.push(basePath)
          }
        } else {
          setError(res.message)
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => router.push(basePath)}
            className="w-10 h-10 p-0"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? `Edit Memo: ${initialData?.memoNumber}` : 'Buat Memo Servis Baru'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Form pencatatan keluhan, checklist pemeriksaan, estimasi pengerjaan & kebutuhan part (SA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Save}
            loading={isPending}
            onClick={() => handleSubmit(false)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Simpan Memo
          </Button>
          <Button
            variant="primary"
            icon={Printer}
            loading={isPending}
            onClick={() => handleSubmit(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Simpan & Cetak Form
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Section 1: Data Pelanggan & Kendaraan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Data Pelanggan */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-purple-600" />
            <span>Data Pemilik Kendaraan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="No. Antrian (Opsional)"
              placeholder="Contoh: A-01 / 01"
              value={queueNumber}
              onChange={(e) => setQueueNumber(e.target.value)}
            />
            <Input
              label="No. HP / WhatsApp"
              placeholder="081234567890"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <Input
            label="Nama Lengkap Pelanggan *"
            placeholder="Masukkan nama pemilik..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <Input
            label="Alamat Pelanggan"
            placeholder="Alamat singkat..."
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </Card>

        {/* Box Data Kendaraan & Teknisi */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <Car className="w-5 h-5 text-purple-600" />
            <span>Data Kendaraan & Teknisi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="No. Polisi (Plat Nomor) *"
              placeholder="B 1234 ABC"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Odometer / KM Masuk"
              type="number"
              placeholder="Contoh: 45000"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </div>

          <Input
            label="Merk / Tipe Kendaraan"
            placeholder="Contoh: Toyota Avanza 1.3 G M/T 2019"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Mekanik Yang Ditunjuk"
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
              options={[
                { label: '-- Pilih Teknisi / Mekanik --', value: '' },
                ...mechanics.map((m) => ({ label: m.name, value: m.id })),
              ]}
            />
            <Input
              label="Estimasi Waktu Pengerjaan"
              placeholder="Contoh: 2 Jam / 1 Hari"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {/* Section 2: Diagnosa & Keluhan */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-purple-600" />
          <span>Keluhan & Diagnosa Awal Kerusakan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keluhan dari Pemilik Kendaraan
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              placeholder="Catat apa saja keluhan yang disampaikan oleh konsumen..."
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Diagnosa Awal SA / Analisa Kerusakan
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
              placeholder="Diagnosa awal Kepala Mekanik / Service Advisor..."
              value={initialDiagnosis}
              onChange={(e) => setInitialDiagnosis(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Catatan Tambahan untuk Kasir / Mekanik
          </label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            placeholder="Keterangan khusus lainnya..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      {/* Section 3: Checklist Komponen yang Dikerjakan (Format Resmi Memo.pdf Halaman 3) */}
      <Card className="p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <ClipboardCheck className="w-5 h-5 text-purple-600" />
            <span>Checklist Komponen Yang Dikerjakan (Form Panduan Servis)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAllTuneUp(false)
                setAllBrakes(false)
                setAllSuspension(false)
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom 1: Tune Up (16 Items) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-sm text-slate-900">1. TUNE UP (16 Poin)</span>
              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAllTuneUp(true)}
                  className="text-purple-600 hover:underline text-[11px]"
                >
                  Pilih Semua
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {TUNE_UP_ITEMS.map((item, idx) => {
                const isChecked = !!tuneUp[item.key]
                return (
                  <label
                    key={item.key}
                    onClick={() => toggleTuneUp(item.key)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors select-none ${
                      isChecked
                        ? 'bg-purple-100/70 text-purple-900 font-semibold border border-purple-200'
                        : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <span className="shrink-0 text-slate-400 font-mono text-[11px] w-4">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 leading-snug">{item.label}</span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Kolom 2: Service Rem & Kaki-kaki */}
          <div className="space-y-6">
            {/* Service Rem (4 Items) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-slate-900">2. SERVICE REM (4 Poin)</span>
                <button
                  type="button"
                  onClick={() => setAllBrakes(true)}
                  className="text-purple-600 hover:underline text-[11px]"
                >
                  Pilih Semua
                </button>
              </div>
              <div className="space-y-1.5">
                {BRAKES_ITEMS.map((item, idx) => {
                  const isChecked = !!brakes[item.key]
                  return (
                    <label
                      key={item.key}
                      onClick={() => toggleBrakes(item.key)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors select-none ${
                        isChecked
                          ? 'bg-purple-100/70 text-purple-900 font-semibold border border-purple-200'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono text-[11px] w-4">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 leading-snug">{item.label}</span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Pemeriksaan Kaki-kaki (6 Items) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-slate-900">3. KAKI-KAKI (6 Poin)</span>
                <button
                  type="button"
                  onClick={() => setAllSuspension(true)}
                  className="text-purple-600 hover:underline text-[11px]"
                >
                  Pilih Semua
                </button>
              </div>
              <div className="space-y-1.5">
                {SUSPENSION_ITEMS.map((item, idx) => {
                  const isChecked = !!suspension[item.key]
                  return (
                    <label
                      key={item.key}
                      onClick={() => toggleSuspension(item.key)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors select-none ${
                        isChecked
                          ? 'bg-purple-100/70 text-purple-900 font-semibold border border-purple-200'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <span className="shrink-0 text-slate-400 font-mono text-[11px] w-4">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 leading-snug">{item.label}</span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Kolom 3: Panduan & Preview Ringkasan Checklist */}
          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/80 space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-purple-900 mb-2">Panduan Alur Kerja SA:</h4>
              <ul className="text-xs text-purple-800 space-y-2 list-disc list-inside leading-relaxed">
                <li>Checklist ini dicetak pada format memo fisik untuk diperiksa mekanik saat pengerjaan.</li>
                <li>Jika saat dibongkar ada kerusakan lain, mekanik mencatat langsung di memo fisik.</li>
                <li>Setelah beres, memo diserahkan ke kasir untuk dicocokkan & dikonversi menjadi invoice resmi.</li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-100 text-xs space-y-1 font-mono">
              <p className="font-bold text-purple-900 font-sans">Total Poin Dipilih:</p>
              <p className="text-slate-600">Tune Up: {Object.values(tuneUp).filter(Boolean).length} / 16</p>
              <p className="text-slate-600">Service Rem: {Object.values(brakes).filter(Boolean).length} / 4</p>
              <p className="text-slate-600">Kaki-Kaki: {Object.values(suspension).filter(Boolean).length} / 6</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 4: Tabel Rencana Pekerjaan (1-10) & Kebutuhan Sparepart (1-10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Rencana Pekerjaan / Jasa */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Wrench className="w-5 h-5 text-purple-600" />
              <span>Rencana Jenis Pekerjaan (Maks. 10)</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={addServiceRow}
              disabled={services.length >= 10}
              className="text-xs py-1 px-2.5 h-auto border-purple-200 text-purple-700"
            >
              Tambah Baris
            </Button>
          </div>

          <div className="space-y-3">
            {services.map((row, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-400 pt-2 w-5">
                  {idx + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    {availableServices.length > 0 && (
                      <select
                        className="w-1/3 text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        value={row.serviceId || ''}
                        onChange={(e) => selectMasterService(idx, e.target.value)}
                      >
                        <option value="">-- Pilih Master Jasa --</option>
                        {availableServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Rp {s.price.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="Nama jenis pekerjaan / servis..."
                      className="flex-1 text-xs rounded-lg border border-slate-200 p-2 bg-white font-medium"
                      value={row.name}
                      onChange={(e) => updateServiceRow(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Estimasi Biaya (Rp)"
                      className="w-1/2 text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono"
                      value={row.estimatedPrice || ''}
                      onChange={(e) => updateServiceRow(idx, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                    />
                    <input
                      type="text"
                      placeholder="Catatan pengerjaan..."
                      className="w-1/2 text-xs rounded-lg border border-slate-200 p-2 bg-white"
                      value={row.notes}
                      onChange={(e) => updateServiceRow(idx, 'notes', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeServiceRow(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Hapus baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabel Kebutuhan Sparepart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Package className="w-5 h-5 text-purple-600" />
              <span>Kebutuhan Sparepart (Maks. 10)</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={addSparepartRow}
              disabled={spareparts.length >= 10}
              className="text-xs py-1 px-2.5 h-auto border-purple-200 text-purple-700"
            >
              Tambah Baris
            </Button>
          </div>

          <div className="space-y-3">
            {spareparts.map((row, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-400 pt-2 w-5">
                  {idx + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    {availableSpareparts.length > 0 && (
                      <select
                        className="w-1/3 text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        value={row.sparepartId || ''}
                        onChange={(e) => selectMasterSparepart(idx, e.target.value)}
                      >
                        <option value="">-- Pilih Sparepart --</option>
                        {availableSpareparts.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} (Stok: {sp.stock} {sp.unit})
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="Nama sparepart / oli..."
                      className="flex-1 text-xs rounded-lg border border-slate-200 p-2 bg-white font-medium"
                      value={row.name}
                      onChange={(e) => updateSparepartRow(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      className="w-20 text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono"
                      value={row.quantity || 1}
                      onChange={(e) => updateSparepartRow(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                    />
                    <input
                      type="text"
                      placeholder="Satuan"
                      className="w-20 text-xs rounded-lg border border-slate-200 p-2 bg-white"
                      value={row.unit}
                      onChange={(e) => updateSparepartRow(idx, 'unit', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Est. Harga (Rp)"
                      className="flex-1 text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono"
                      value={row.estimatedPrice || ''}
                      onChange={(e) => updateSparepartRow(idx, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSparepartRow(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Hapus baris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom submit bar */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => router.push(basePath)}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          variant="outline"
          icon={Save}
          loading={isPending}
          onClick={() => handleSubmit(false)}
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          Simpan Memo
        </Button>
        <Button
          variant="primary"
          icon={Printer}
          loading={isPending}
          onClick={() => handleSubmit(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Simpan & Cetak Form
        </Button>
      </div>
    </div>
  )
}
