'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
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
  Search,
  Check,
  Sparkles,
  X,
  Database,
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
import { searchCustomers } from '@/actions/customer'
import { searchSpareparts } from '@/actions/sparepart'
import { searchServices } from '@/actions/service'

interface MechanicOption {
  id: string
  name: string
  phone?: string | null
}

export interface CustomerOption {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  plateNumber?: string | null
  vehicleBrand?: string | null
  vehicleType?: string | null
  vehicleYear?: string | null
  odometer?: number | null
}

interface ServiceOption {
  id: string
  name: string
  price: number
  category?: string | null
}

interface SparepartOption {
  id: string
  name: string
  sku?: string | null
  sellPrice: number
  buyPrice?: number | null
  stock: number
  unit: string
}

interface MemoFormProps {
  initialData?: any
  mechanics: MechanicOption[]
  availableServices?: ServiceOption[]
  availableSpareparts?: SparepartOption[]
  availableCustomers?: CustomerOption[]
  branchId?: string | null
  isEdit?: boolean
  basePath?: string
}

export default function MemoForm({
  initialData,
  mechanics = [],
  availableServices = [],
  availableSpareparts = [],
  availableCustomers = [],
  branchId,
  isEdit = false,
  basePath = '/mekanik',
}: MemoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Quick Customer Search from Database
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerOption[]>(availableCustomers.slice(0, 8))
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerMeta, setSelectedCustomerMeta] = useState<string | null>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  // Live Row Search States for Services & Spareparts
  const [activeServiceSearchIdx, setActiveServiceSearchIdx] = useState<number | null>(null)
  const [serviceSearchResults, setServiceSearchResults] = useState<ServiceOption[]>(availableServices.slice(0, 10))
  const [isSearchingServices, setIsSearchingServices] = useState(false)

  const [activeSparepartSearchIdx, setActiveSparepartSearchIdx] = useState<number | null>(null)
  const [sparepartSearchResults, setSparepartSearchResults] = useState<SparepartOption[]>(availableSpareparts.slice(0, 10))
  const [isSearchingSpareparts, setIsSearchingSpareparts] = useState(false)

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

  // Debounced search customer
  useEffect(() => {
    if (!customerSearchQuery.trim()) {
      setCustomerSearchResults(availableCustomers.slice(0, 8))
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true)
      try {
        const results = await searchCustomers(customerSearchQuery, branchId)
        setCustomerSearchResults(results as CustomerOption[])
      } catch (err) {
        console.error('Customer search error:', err)
      } finally {
        setIsSearchingCustomer(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [customerSearchQuery, branchId, availableCustomers])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCustomer = (c: CustomerOption) => {
    setCustomerName(c.name || '')
    if (c.phone) setCustomerPhone(c.phone)
    if (c.address) setCustomerAddress(c.address)
    if (c.plateNumber) setVehiclePlate(c.plateNumber.toUpperCase())

    const modelParts = [c.vehicleBrand, c.vehicleType, c.vehicleYear].filter(Boolean)
    if (modelParts.length > 0) {
      setVehicleModel(modelParts.join(' '))
    }
    if (c.odometer !== undefined && c.odometer !== null) {
      setOdometer(String(c.odometer))
    }

    setSelectedCustomerMeta(
      `${c.plateNumber || 'Tanpa Plat'} · ${c.name}${modelParts.length ? ` (${modelParts.join(' ')})` : ''}`
    )
    setShowCustomerDropdown(false)
    setCustomerSearchQuery('')
  }

  const handleClearSelectedCustomer = () => {
    setSelectedCustomerMeta(null)
  }

  // Dynamic Service rows (1-10)
  const [services, setServices] = useState<
    Array<{ serviceId?: string; name: string; estimatedPrice: number; buyPrice: number | ''; notes: string }>
  >(
    initialData?.services?.length
      ? initialData.services.map((s: any) => ({
          serviceId: s.serviceId || '',
          name: s.name,
          estimatedPrice: s.estimatedPrice || 0,
          buyPrice: s.buyPrice !== undefined && s.buyPrice !== null ? s.buyPrice : '',
          notes: s.notes || '',
        }))
      : [{ serviceId: '', name: '', estimatedPrice: 0, buyPrice: '', notes: '' }]
  )

  // Dynamic Sparepart rows (1-10)
  const [spareparts, setSpareparts] = useState<
    Array<{ sparepartId?: string; name: string; quantity: number; unit: string; estimatedPrice: number; buyPrice: number | ''; notes: string }>
  >(
    initialData?.spareparts?.length
      ? initialData.spareparts.map((sp: any) => ({
          sparepartId: sp.sparepartId || '',
          name: sp.name,
          quantity: sp.quantity || 1,
          unit: sp.unit || 'pcs',
          estimatedPrice: sp.estimatedPrice || 0,
          buyPrice: sp.buyPrice !== undefined && sp.buyPrice !== null ? sp.buyPrice : '',
          notes: sp.notes || '',
        }))
      : [{ sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, buyPrice: '', notes: '' }]
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
      setServices([...services, { serviceId: '', name: '', estimatedPrice: 0, buyPrice: '', notes: '' }])
    }
  }
  const removeServiceRow = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    } else {
      setServices([{ serviceId: '', name: '', estimatedPrice: 0, buyPrice: '', notes: '' }])
    }
  }
  const updateServiceRow = (index: number, field: string, value: any) => {
    const next = [...services]
    next[index] = { ...next[index], [field]: value }
    setServices(next)
  }

  const handleServiceNameInput = async (idx: number, text: string) => {
    updateServiceRow(idx, 'name', text)
    setActiveServiceSearchIdx(idx)

    if (!text.trim()) {
      setServiceSearchResults(availableServices.slice(0, 10))
      return
    }

    const q = text.toLowerCase()
    const local = availableServices.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 15)
    if (local.length > 0) {
      setServiceSearchResults(local)
    }

    try {
      setIsSearchingServices(true)
      const remote = await searchServices(text, branchId)
      setServiceSearchResults(remote as ServiceOption[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingServices(false)
    }
  }

  const handleSelectServiceItem = (idx: number, s: ServiceOption) => {
    const next = [...services]
    next[idx] = {
      ...next[idx],
      serviceId: s.id,
      name: s.name,
      estimatedPrice: s.price,
      buyPrice: '',
    }
    setServices(next)
    setActiveServiceSearchIdx(null)
  }

  // Sparepart Row helpers
  const addSparepartRow = () => {
    if (spareparts.length < 10) {
      setSpareparts([...spareparts, { sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, buyPrice: '', notes: '' }])
    }
  }
  const removeSparepartRow = (index: number) => {
    if (spareparts.length > 1) {
      setSpareparts(spareparts.filter((_, i) => i !== index))
    } else {
      setSpareparts([{ sparepartId: '', name: '', quantity: 1, unit: 'pcs', estimatedPrice: 0, buyPrice: '', notes: '' }])
    }
  }
  const updateSparepartRow = (index: number, field: string, value: any) => {
    const next = [...spareparts]
    next[index] = { ...next[index], [field]: value }
    setSpareparts(next)
  }

  const handleSparepartNameInput = async (idx: number, text: string) => {
    updateSparepartRow(idx, 'name', text)
    setActiveSparepartSearchIdx(idx)

    if (!text.trim()) {
      setSparepartSearchResults(availableSpareparts.slice(0, 10))
      return
    }

    const q = text.toLowerCase()
    const local = availableSpareparts
      .filter(
        (sp) => sp.name.toLowerCase().includes(q) || (sp.sku && sp.sku.toLowerCase().includes(q))
      )
      .slice(0, 15)
    if (local.length > 0) {
      setSparepartSearchResults(local)
    }

    try {
      setIsSearchingSpareparts(true)
      const remote = await searchSpareparts(text, branchId)
      setSparepartSearchResults(remote as SparepartOption[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingSpareparts(false)
    }
  }

  const handleSelectSparepartItem = (idx: number, sp: SparepartOption) => {
    const next = [...spareparts]
    next[idx] = {
      ...next[idx],
      sparepartId: sp.id,
      name: sp.name,
      unit: sp.unit || 'pcs',
      estimatedPrice: sp.sellPrice,
      buyPrice: sp.buyPrice !== undefined && sp.buyPrice !== null ? sp.buyPrice : '',
    }
    setSpareparts(next)
    setActiveSparepartSearchIdx(null)
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
        services: services
          .filter((s) => s.name.trim().length > 0)
          .map((s) => ({
            ...s,
            buyPrice: s.buyPrice !== '' ? Number(s.buyPrice) : null,
          })),
        spareparts: spareparts
          .filter((sp) => sp.name.trim().length > 0)
          .map((sp) => ({
            ...sp,
            buyPrice: sp.buyPrice !== '' ? Number(sp.buyPrice) : null,
          })),
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

      {/* Widget Panggil Data Pelanggan & Kendaraan dari Database Kasir */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Panggil Data Pelanggan / Kendaraan Kasir
                <span className="text-[10px] font-normal px-2 py-0.5 bg-purple-500/40 border border-purple-400/30 rounded-full text-purple-200">
                  Otomatis Terisi
                </span>
              </h2>
              <p className="text-xs text-purple-200/80">
                Ketik Plat Nomor, Nama Pemilik, atau No. HP untuk mengambil riwayat mobil yang sudah terdaftar di kasir
              </p>
            </div>
          </div>
        </div>

        {/* Input Search + Dropdown */}
        <div className="relative" ref={searchDropdownRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              type="text"
              placeholder="🔍 Ketik Plat Nomor (contoh: B 1234) atau Nama Pelanggan..."
              value={customerSearchQuery}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value)
                setShowCustomerDropdown(true)
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-purple-950/70 border border-purple-400/40 focus:border-purple-300 focus:bg-purple-950 rounded-xl text-sm text-white placeholder:text-purple-300/60 outline-none transition-all shadow-inner"
            />
            {customerSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setCustomerSearchQuery('')
                  setShowCustomerDropdown(false)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Hasil Pencarian */}
          {showCustomerDropdown && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
              {isSearchingCustomer ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>Mencari data di database kasir...</span>
                </div>
              ) : customerSearchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak ditemukan data pelanggan dengan kata kunci &quot;<strong>{customerSearchQuery}</strong>&quot;. Anda bisa langsung mengetik manual di kolom bawah.
                </div>
              ) : (
                customerSearchResults.map((c) => {
                  const car = [c.vehicleBrand, c.vehicleType, c.vehicleYear].filter(Boolean).join(' ')
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-3 hover:bg-purple-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                            {c.plateNumber || 'TANPA PLAT'}
                          </span>
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {c.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {car ? `🚗 ${car}` : '🚗 Kendaraan umum'} {c.phone ? ` • 📞 ${c.phone}` : ''} {c.odometer ? ` • KM Terakhir: ${c.odometer.toLocaleString('id-ID')}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 group-hover:bg-purple-600 group-hover:text-white px-2.5 py-1 rounded-lg shrink-0 transition-all">
                        Pilih & Isi ↵
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Badge info */}
        {selectedCustomerMeta && (
          <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-2 rounded-xl text-xs text-emerald-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-300" />
              Data berhasil diisi dari kasir: <strong className="text-white">{selectedCustomerMeta}</strong>
            </span>
            <button
              type="button"
              onClick={handleClearSelectedCustomer}
              className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
            >
              Ubah / Reset
            </button>
          </div>
        )}
      </div>

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
              <div key={idx} className="flex items-start gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-400 pt-2 w-5">
                  {idx + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Ketik nama jasa / pilih dari master (atau custom)..."
                        className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all pr-8"
                        value={row.name}
                        onChange={(e) => handleServiceNameInput(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
                            setActiveServiceSearchIdx(null)
                          }
                        }}
                        onFocus={() => {
                          setActiveServiceSearchIdx(idx)
                          if (!row.name) setServiceSearchResults(availableServices.slice(0, 10))
                        }}
                        onBlur={() => {
                          setTimeout(() => setActiveServiceSearchIdx(null), 200)
                        }}
                      />
                      {row.name && (
                        <button
                          type="button"
                          onClick={() => {
                            updateServiceRow(idx, 'name', '')
                            updateServiceRow(idx, 'serviceId', '')
                            setActiveServiceSearchIdx(null)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Popover Hasil Pencarian Master Jasa */}
                    {activeServiceSearchIdx === idx && serviceSearchResults.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                        {isSearchingServices ? (
                          <div className="p-3 text-center text-xs text-slate-400">Mencari jasa...</div>
                        ) : (
                          serviceSearchResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={() => handleSelectServiceItem(idx, s)}
                              className="w-full text-left p-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                            >
                              <span className="font-semibold text-slate-900 group-hover:text-purple-700">{s.name}</span>
                              <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                Rp {s.price.toLocaleString('id-ID')}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        Harga Modal / Subkon
                      </label>
                      <input
                        type="number"
                        placeholder="Rp 0"
                        className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono"
                        value={row.buyPrice === '' ? '' : row.buyPrice}
                        onChange={(e) => updateServiceRow(idx, 'buyPrice', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        Harga Jual / Biaya <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Rp 0"
                        className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono font-bold text-slate-800"
                        value={row.estimatedPrice || ''}
                        onChange={(e) => updateServiceRow(idx, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        Catatan Pengerjaan
                      </label>
                      <input
                        type="text"
                        placeholder="Catatan teknis..."
                        className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                        value={row.notes}
                        onChange={(e) => updateServiceRow(idx, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeServiceRow(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-1 cursor-pointer"
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
            {spareparts.map((row, idx) => {
              const buyVal = typeof row.buyPrice === 'number' ? row.buyPrice : 0
              const sellVal = typeof row.estimatedPrice === 'number' ? row.estimatedPrice : 0
              const margin = sellVal - buyVal

              return (
                <div key={idx} className="flex items-start gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-400 pt-2 w-5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Ketik nama / SKU sparepart (contoh: oli, busi, 088)..."
                          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all pr-8"
                          value={row.name}
                          onChange={(e) => handleSparepartNameInput(idx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
                              setActiveSparepartSearchIdx(null)
                            }
                          }}
                          onFocus={() => {
                            setActiveSparepartSearchIdx(idx)
                            if (!row.name) setSparepartSearchResults(availableSpareparts.slice(0, 10))
                          }}
                          onBlur={() => {
                            setTimeout(() => setActiveSparepartSearchIdx(null), 200)
                          }}
                        />
                        {row.name && (
                          <button
                            type="button"
                            onClick={() => {
                              updateSparepartRow(idx, 'name', '')
                              updateSparepartRow(idx, 'sparepartId', '')
                              setActiveSparepartSearchIdx(null)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Popover Hasil Pencarian Master Sparepart */}
                      {activeSparepartSearchIdx === idx && sparepartSearchResults.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                          {isSearchingSpareparts ? (
                            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                              <span>Mencari di 1.717+ data sparepart...</span>
                            </div>
                          ) : (
                            sparepartSearchResults.map((sp) => (
                              <button
                                key={sp.id}
                                type="button"
                                onMouseDown={() => handleSelectSparepartItem(idx, sp)}
                                className="w-full text-left p-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between text-xs cursor-pointer group gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {sp.sku && (
                                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                        {sp.sku}
                                      </span>
                                    )}
                                    <span className="font-semibold text-slate-900 group-hover:text-purple-700 truncate">{sp.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    Stok: <strong>{sp.stock} {sp.unit}</strong>
                                    {sp.buyPrice ? ` • Modal: Rp ${sp.buyPrice.toLocaleString('id-ID')}` : ''}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md shrink-0">
                                  Rp {sp.sellPrice.toLocaleString('id-ID')}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Jumlah (Qty)
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            className="w-14 text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono text-center"
                            value={row.quantity || 1}
                            onChange={(e) => updateSparepartRow(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          />
                          <input
                            type="text"
                            placeholder="Satuan"
                            className="w-16 text-xs rounded-lg border border-slate-200 p-2 bg-white text-center"
                            value={row.unit}
                            onChange={(e) => updateSparepartRow(idx, 'unit', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Harga Modal (Beli)
                        </label>
                        <input
                          type="number"
                          placeholder="Rp 0"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono"
                          value={row.buyPrice === '' ? '' : row.buyPrice}
                          onChange={(e) => updateSparepartRow(idx, 'buyPrice', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Harga Jual <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Rp 0"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-mono font-bold text-slate-800"
                          value={row.estimatedPrice || ''}
                          onChange={(e) => updateSparepartRow(idx, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                          Catatan / Margin
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Catatan..."
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                            value={row.notes}
                            onChange={(e) => updateSparepartRow(idx, 'notes', e.target.value)}
                          />
                        </div>
                        {buyVal > 0 && sellVal > 0 && (
                          <span className={`text-[10px] font-medium block mt-0.5 ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {margin >= 0 ? `Laba: Rp ${(margin * (row.quantity || 1)).toLocaleString('id-ID')}` : `Rugi: Rp ${(Math.abs(margin) * (row.quantity || 1)).toLocaleString('id-ID')}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSparepartRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-1 cursor-pointer"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
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
