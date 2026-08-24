'use client'

import { useState, useTransition, useMemo } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createCorporateServiceTransaction, type ServiceItem } from '@/actions/corporate'
import { formatCurrency } from '@/lib/utils'
import {
  Wrench,
  Package,
  PackagePlus,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Car,
  User,
  ChevronDown,
} from 'lucide-react'

interface ServiceOption {
  id: string
  name: string
  price: number
  category?: string | null
}

interface SparepartOption {
  id: string
  name: string
  sellPrice: number
  stock: number
  unit: string
  sku?: string | null
  sparepartBrand?: string | null
}

interface MechanicOption {
  id: string
  name: string
}

interface VehicleInfo {
  id: string
  name: string
  plateNumber?: string | null
  vehicleBrand?: string | null
  vehicleType?: string | null
  odometer?: number | null
}

interface ServiceVehicleModalProps {
  open: boolean
  onClose: () => void
  vehicle: VehicleInfo
  corporateCustomerId: string
  branchId: string
  corporateName: string
  services: ServiceOption[]
  spareparts: SparepartOption[]
  mechanics: MechanicOption[]
  isAdmin?: boolean
  onSuccess?: (invoiceNumber: string) => void
}

interface LineItem {
  id: string
  itemType: 'SERVICE' | 'SPAREPART'
  itemId: string | null
  itemName: string
  quantity: number
  unitPrice: number
  stock?: number
  unit?: string
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function ServiceVehicleModal({
  open,
  onClose,
  vehicle,
  corporateCustomerId,
  branchId,
  corporateName,
  services,
  spareparts,
  mechanics,
  isAdmin = false,
  onSuccess,
}: ServiceVehicleModalProps) {
  const [isPending, startTransition] = useTransition()

  const [mechanicId, setMechanicId] = useState<string>('')
  const [odometer, setOdometer] = useState<string>(vehicle.odometer?.toString() ?? '')
  const [notes, setNotes] = useState<string>('')
  const [discount, setDiscount] = useState<string>('0')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ invoiceNumber: string; transactionId?: string } | null>(null)
  const [items, setItems] = useState<LineItem[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [sparepartSearch, setSparepartSearch] = useState('')
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [showSparepartPicker, setShowSparepartPicker] = useState(false)

  const filteredServices = useMemo(() => {
    const q = serviceSearch.toLowerCase()
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.category?.toLowerCase() ?? '').includes(q)
    )
  }, [services, serviceSearch])

  const filteredSpareparts = useMemo(() => {
    const q = sparepartSearch.toLowerCase()
    return spareparts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.sku?.toLowerCase() ?? '').includes(q) ||
        (s.sparepartBrand?.toLowerCase() ?? '').includes(q)
    )
  }, [spareparts, sparepartSearch])

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
  const discountVal = Math.max(0, parseFloat(discount) || 0)
  const grandTotal = Math.max(0, subtotal - discountVal)

  const stockErrors = items.filter(
    (item) =>
      item.itemType === 'SPAREPART' &&
      item.itemId &&
      !item.itemId.startsWith('MANUAL_') &&
      item.stock !== undefined &&
      item.quantity > item.stock
  )

  const addService = (svc: ServiceOption) => {
    if (items.some((i) => i.itemId === svc.id && i.itemType === 'SERVICE')) {
      setShowServicePicker(false)
      return
    }
    setItems((prev) => [
      ...prev,
      { id: generateId(), itemType: 'SERVICE', itemId: svc.id, itemName: svc.name, quantity: 1, unitPrice: svc.price },
    ])
    setServiceSearch('')
    setShowServicePicker(false)
  }

  const addManualService = (customName?: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        itemType: 'SERVICE',
        itemId: 'MANUAL_JASA_' + Date.now(),
        itemName: customName?.trim() || 'Jasa Custom',
        quantity: 1,
        unitPrice: 0,
      },
    ])
    setServiceSearch('')
    setShowServicePicker(false)
  }

  const addSparepart = (sp: SparepartOption) => {
    const existing = items.find((i) => i.itemId === sp.id && i.itemType === 'SPAREPART')
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + 1)
      setShowSparepartPicker(false)
      return
    }
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        itemType: 'SPAREPART',
        itemId: sp.id,
        itemName: sp.name,
        quantity: 1,
        unitPrice: sp.sellPrice,
        stock: sp.stock,
        unit: sp.unit,
      },
    ])
    setSparepartSearch('')
    setShowSparepartPicker(false)
  }

  const addManualSparepart = (customName?: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        itemType: 'SPAREPART',
        itemId: 'MANUAL_PART_' + Date.now(),
        itemName: customName?.trim() || 'Sparepart Luar',
        quantity: 1,
        unitPrice: 0,
        unit: 'pcs',
      },
    ])
    setSparepartSearch('')
    setShowSparepartPicker(false)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: 'quantity' | 'unitPrice' | 'itemName', value: number | string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: field === 'itemName' ? value : Number(value) } : item))
    )
  }

  const handleClose = () => {
    if (isPending) return
    setItems([])
    setMechanicId('')
    setOdometer(vehicle.odometer?.toString() ?? '')
    setNotes('')
    setDiscount('0')
    setErrorMsg(null)
    setSuccessData(null)
    setShowServicePicker(false)
    setShowSparepartPicker(false)
    onClose()
  }

  const handleSubmit = () => {
    setErrorMsg(null)
    if (items.length === 0) {
      setErrorMsg('Tambahkan minimal satu jasa atau sparepart')
      return
    }
    if (stockErrors.length > 0) {
      setErrorMsg('Stok sparepart toko tidak mencukupi. Periksa kembali quantity.')
      return
    }

    startTransition(async () => {
      const payload: ServiceItem[] = items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName.trim() || (item.itemType === 'SERVICE' ? 'Jasa Custom' : 'Sparepart Luar'),
        quantity: item.quantity > 0 ? item.quantity : 1,
        unitPrice: item.unitPrice >= 0 ? item.unitPrice : 0,
      }))

      const res = await createCorporateServiceTransaction({
        customerId: vehicle.id,
        corporateCustomerId,
        branchId,
        mechanicId: mechanicId || null,
        items: payload,
        discount: discountVal,
        notes: notes || null,
        odometer: odometer ? parseInt(odometer) : null,
      })

      if (res.success && res.invoiceNumber) {
        setSuccessData({ invoiceNumber: res.invoiceNumber, transactionId: res.transactionId })
        onSuccess?.(res.invoiceNumber)
      } else {
        setErrorMsg(res.message || 'Gagal membuat nota service')
      }
    })
  }

  if (successData) {
    const txPath = isAdmin ? '/admin/transaksi' : '/kasir/transaksi'
    const targetUrl = `${txPath}/${successData.transactionId || successData.invoiceNumber}`

    return (
      <Modal open={open} onClose={handleClose} title="Nota Berhasil Dibuat" size="md">
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">Service Berhasil Disimpan!</p>
            <p className="text-sm text-slate-500 mt-1">
              Nota telah dibuat untuk kendaraan <strong>{vehicle.name}</strong>
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 w-full">
            <p className="text-xs text-slate-500 mb-1">Nomor Invoice</p>
            <p className="text-xl font-mono font-bold text-slate-900">{successData.invoiceNumber}</p>
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 w-full text-left">
            <p className="text-sm text-violet-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Tagihan masuk ke tab <strong>Tagihan</strong> dengan status <strong>Pending Korporat</strong>
            </p>
          </div>
        </div>
        <ModalFooter>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium transition-all duration-200 px-4 py-2.5 text-sm gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 shrink-0" />
            Cetak Struk Nota
          </a>
          <Button onClick={handleClose}>Tutup</Button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Service Kendaraan"
      description={`${corporateName} — Input detail service kendaraan`}
      size="xl"
    >
      {/* Vehicle Info */}
      <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl mb-5">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-violet-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{vehicle.name}</p>
          <div className="flex items-center gap-3 flex-wrap">
            {vehicle.plateNumber && (
              <span className="text-xs font-mono text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                {vehicle.plateNumber}
              </span>
            )}
            {vehicle.vehicleBrand && (
              <span className="text-xs text-slate-500">
                {vehicle.vehicleBrand} {vehicle.vehicleType}
              </span>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Mechanic + Odometer */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />Mekanik
            </label>
            <div className="relative">
              <select
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 pr-8"
              >
                <option value="">— Pilih Mekanik —</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <Input
            label="Odometer (km)"
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder={vehicle.odometer?.toString() ?? 'Opsional'}
          />
        </div>

        {/* Jasa Service */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />Jasa Service
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline" icon={Plus}
                onClick={() => { setShowServicePicker(true); setShowSparepartPicker(false) }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >Tambah Jasa</Button>
              <button
                type="button"
                onClick={() => addManualService()}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                + Jasa Custom
              </button>
            </div>
          </div>

          {showServicePicker && (
            <div className="mb-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus type="text" value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Cari nama jasa..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {filteredServices.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-400 mb-2">Tidak ada jasa ditemukan untuk &quot;{serviceSearch}&quot;</p>
                    {serviceSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => addManualService(serviceSearch)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Jadikan Jasa Custom &quot;{serviceSearch}&quot;
                      </button>
                    )}
                  </div>
                ) : filteredServices.map((svc) => (
                  <button key={svc.id} type="button" onClick={() => addService(svc)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{svc.name}</p>
                      {svc.category && <p className="text-xs text-slate-400">{svc.category}</p>}
                    </div>
                    <span className="text-sm font-bold text-blue-700">{formatCurrency(svc.price)}</span>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addManualService(serviceSearch)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
                >
                  + Tambah Jasa Custom Manual
                </button>
                <button type="button" onClick={() => setShowServicePicker(false)}
                  className="text-xs text-slate-400 py-1 hover:text-slate-600">Tutup</button>
              </div>
            </div>
          )}

          {items.filter((i) => i.itemType === 'SERVICE').length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2 px-1">Belum ada jasa ditambahkan</p>
          ) : (
            <div className="space-y-2">
              {items.filter((i) => i.itemType === 'SERVICE').map((item) => {
                const isCustom = item.itemId?.startsWith('MANUAL_')
                return (
                  <div key={item.id} className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-2">
                    <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-b border-dashed border-blue-200 focus:outline-none focus:border-blue-400 pb-0.5"
                          value={item.itemName}
                          placeholder="Nama Jasa..."
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        />
                        {isCustom && (
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input type="number" min={1} value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-14 text-sm text-center border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-500">Rp</span>
                      <input type="number" min={0} value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        className="w-28 text-sm text-right border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white font-medium"
                      />
                    </div>
                    <span className="text-sm font-bold text-blue-700 w-28 text-right shrink-0">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                    <button type="button" onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sparepart */}
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-orange-500" />Sparepart
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline" icon={Plus}
                onClick={() => { setShowSparepartPicker(true); setShowServicePicker(false) }}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >Tambah Sparepart</Button>
              <button
                type="button"
                onClick={() => addManualSparepart()}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                + Part Luar (Non-Stok)
              </button>
            </div>
          </div>

          {showSparepartPicker && (
            <div className="mb-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus type="text" value={sparepartSearch}
                    onChange={(e) => setSparepartSearch(e.target.value)}
                    placeholder="Cari nama / SKU / brand..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                {filteredSpareparts.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-400 mb-2">Tidak ada sparepart ditemukan untuk &quot;{sparepartSearch}&quot;</p>
                    {sparepartSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => addManualSparepart(sparepartSearch)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Jadikan Sparepart Luar &quot;{sparepartSearch}&quot;
                      </button>
                    )}
                  </div>
                ) : filteredSpareparts.map((sp) => (
                  <button key={sp.id} type="button" onClick={() => addSparepart(sp)} disabled={sp.stock === 0}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sp.name}</p>
                      <div className="flex items-center gap-2">
                        {sp.sparepartBrand && <span className="text-xs text-slate-400">{sp.sparepartBrand}</span>}
                        <span className={`text-xs font-medium ${sp.stock <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                          Stok Toko: {sp.stock} {sp.unit}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange-700">{formatCurrency(sp.sellPrice)}</span>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addManualSparepart(sparepartSearch)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1"
                >
                  + Tambah Sparepart Luar (Non-Stok)
                </button>
                <button type="button" onClick={() => setShowSparepartPicker(false)}
                  className="text-xs text-slate-400 py-1 hover:text-slate-600">Tutup</button>
              </div>
            </div>
          )}

          {items.filter((i) => i.itemType === 'SPAREPART').length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2 px-1">Belum ada sparepart ditambahkan</p>
          ) : (
            <div className="space-y-2">
              {items.filter((i) => i.itemType === 'SPAREPART').map((item) => {
                const isCustom = item.itemId?.startsWith('MANUAL_')
                const overStock = !isCustom && item.stock !== undefined && item.quantity > item.stock
                return (
                  <div key={item.id}
                    className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                      overStock ? 'bg-red-50/50 border-red-200' : isCustom ? 'bg-amber-50/30 border-amber-200' : 'bg-orange-50/30 border-orange-100'
                    }`}>
                    {isCustom ? (
                      <PackagePlus className="w-4 h-4 shrink-0 text-amber-600" />
                    ) : (
                      <Package className={`w-4 h-4 shrink-0 ${overStock ? 'text-red-400' : 'text-orange-400'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isCustom ? (
                          <input
                            className="w-full text-sm font-medium text-slate-900 bg-transparent border-b border-dashed border-amber-300 focus:outline-none focus:border-amber-500 pb-0.5"
                            value={item.itemName}
                            placeholder="Nama Sparepart Luar..."
                            onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-900 truncate">{item.itemName}</p>
                        )}
                        {isCustom && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                            Luar (Non-Stok)
                          </span>
                        )}
                      </div>
                      {!isCustom && item.stock !== undefined && (
                        <p className={`text-xs ${overStock ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                          Stok Toko: {item.stock} {item.unit}{overStock && ' ← Melebihi stok!'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input type="number" min={1} value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className={`w-14 text-sm text-center border rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 bg-white ${
                          overStock ? 'border-red-300 focus:ring-red-500/30' : isCustom ? 'border-amber-200 focus:ring-amber-500/30' : 'border-slate-200 focus:ring-orange-500/30'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-500">Rp</span>
                      <input type="number" min={0} value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        className={`w-28 text-sm text-right border rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 bg-white font-medium ${
                          isCustom ? 'border-amber-200 focus:ring-amber-500/30' : 'border-slate-200 focus:ring-orange-500/30'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-bold text-orange-700 w-28 text-right shrink-0">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                    <button type="button" onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Keluhan pelanggan, hasil inspeksi, dll..." rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
          />
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal ({items.length} item)</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Diskon</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Rp</span>
                <input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 text-sm text-right border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-base font-bold text-slate-900">Total Nota</span>
              <span className="text-xl font-black text-violet-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>Batal</Button>
        <Button
          onClick={handleSubmit}
          loading={isPending}
          disabled={items.length === 0 || stockErrors.length > 0}
          className="bg-violet-600 hover:bg-violet-700 min-w-40"
        >
          Simpan &amp; Buat Nota
        </Button>
      </ModalFooter>
    </Modal>
  )
}
