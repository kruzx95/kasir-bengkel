'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Modal, { ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { 
  ArrowRightLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Warehouse, 
  Store, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Layers
} from 'lucide-react'
import { createStockTransfer, getSparepartsForTransfer } from '@/actions/stock-transfer'

export interface TransferSparepart {
  id: string
  name: string
  sku: string | null
  stock: number
  warehouseStock: number
  unit: string
  sparepartBrand?: string | null
  etalase?: string | null
  branchId?: string
}

interface Branch {
  id: string
  name: string
}

interface TransferStockModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialSparepart?: TransferSparepart | null
  initialType?: 'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'
  branches?: Branch[]
}

export default function TransferStockModal({
  open,
  onClose,
  onSuccess,
  initialSparepart = null,
  initialType = 'WAREHOUSE_TO_STORE',
  branches = [],
}: TransferStockModalProps) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'>(initialType)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '')
  
  const [spareparts, setSpareparts] = useState<TransferSparepart[]>([])
  const [loadingSpareparts, setLoadingSpareparts] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSparepart, setSelectedSparepart] = useState<TransferSparepart | null>(initialSparepart)
  
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)

  // Reset & load on open
  useEffect(() => {
    if (open) {
      setType(initialType)
      setSelectedSparepart(initialSparepart)
      setQuantity(1)
      setNotes('')
      setStatus(null)
      setSearchTerm('')

      // Fetch all spareparts for branch
      setLoadingSpareparts(true)
      getSparepartsForTransfer(selectedBranchId || undefined)
        .then((data) => {
          setSpareparts(data)
          // If initialSparepart was passed, sync latest stock values from fetched data
          if (initialSparepart) {
            const fresh = data.find((sp) => sp.id === initialSparepart.id)
            if (fresh) setSelectedSparepart(fresh)
          }
        })
        .finally(() => setLoadingSpareparts(false))
    }
  }, [open, initialSparepart, initialType, selectedBranchId])

  const maxAvailable = useMemo(() => {
    if (!selectedSparepart) return 0
    return type === 'WAREHOUSE_TO_STORE'
      ? selectedSparepart.warehouseStock
      : selectedSparepart.stock
  }, [selectedSparepart, type])

  const filteredSpareparts = useMemo(() => {
    if (!searchTerm.trim()) return spareparts.slice(0, 30)
    const term = searchTerm.toLowerCase().trim()
    return spareparts.filter(
      (sp) =>
        sp.name.toLowerCase().includes(term) ||
        (sp.sku && sp.sku.toLowerCase().includes(term)) ||
        (sp.sparepartBrand && sp.sparepartBrand.toLowerCase().includes(term)) ||
        (sp.etalase && sp.etalase.toLowerCase().includes(term))
    )
  }, [spareparts, searchTerm])

  const handleSelectSparepart = (sp: TransferSparepart) => {
    setSelectedSparepart(sp)
    setQuantity(1)
    setStatus(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSparepart) {
      setStatus({ success: false, message: 'Silakan pilih sparepart yang akan ditransfer.' })
      return
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setStatus({ success: false, message: 'Jumlah transfer minimal 1 unit.' })
      return
    }

    if (qty > maxAvailable) {
      const source = type === 'WAREHOUSE_TO_STORE' ? 'gudang' : 'toko'
      setStatus({
        success: false,
        message: `Jumlah melebihi stok ${source} yang tersedia (${maxAvailable} ${selectedSparepart.unit}).`,
      })
      return
    }

    startTransition(async () => {
      setStatus(null)
      const res = await createStockTransfer({
        sparepartId: selectedSparepart.id,
        quantity: qty,
        type,
        notes: notes.trim() || undefined,
        branchId: selectedBranchId || undefined,
      })

      if (res.success) {
        setStatus({ success: true, message: res.message || 'Transfer stok berhasil!' })
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            window.location.reload()
          }
        }, 1200)
      } else {
        setStatus({ success: false, message: res.message || 'Gagal melakukan transfer stok.' })
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Stok Antar Gudang & Toko"
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Step 1: Direction Switcher */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Arah Perpindahan Stok
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('WAREHOUSE_TO_STORE')
                setStatus(null)
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                type === 'WAREHOUSE_TO_STORE'
                  ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                type === 'WAREHOUSE_TO_STORE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${type === 'WAREHOUSE_TO_STORE' ? 'text-blue-900' : 'text-slate-800'}`}>
                  Gudang → Toko
                </p>
                <p className="text-[11px] text-slate-500 truncate">Keluarkan untuk display kasir</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('STORE_TO_WAREHOUSE')
                setStatus(null)
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                type === 'STORE_TO_WAREHOUSE'
                  ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                type === 'STORE_TO_WAREHOUSE' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${type === 'STORE_TO_WAREHOUSE' ? 'text-purple-900' : 'text-slate-800'}`}>
                  Toko → Gudang
                </p>
                <p className="text-[11px] text-slate-500 truncate">Retur / simpan ke gudang</p>
              </div>
            </button>
          </div>
        </div>

        {/* Branch Selector (if multiple branches) */}
        {branches.length > 1 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cabang
            </label>
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
        )}

        {/* Step 2: Select Sparepart */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Pilih Sparepart
          </label>

          {selectedSparepart ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{selectedSparepart.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                  {selectedSparepart.sku && (
                    <span className="text-slate-500">SKU: {selectedSparepart.sku}</span>
                  )}
                  {selectedSparepart.etalase && (
                    <span className="text-slate-500">| Rak: {selectedSparepart.etalase}</span>
                  )}
                </div>
                {/* Live Stock Comparison Card */}
                <div className="flex items-center gap-4 mt-2 text-xs font-mono font-semibold">
                  <span className={`px-2 py-0.5 rounded ${
                    type === 'WAREHOUSE_TO_STORE' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200/70 text-slate-700'
                  }`}>
                    Gudang: {selectedSparepart.warehouseStock} {selectedSparepart.unit}
                  </span>
                  <span>→</span>
                  <span className={`px-2 py-0.5 rounded ${
                    type === 'STORE_TO_WAREHOUSE' ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-200/70 text-slate-700'
                  }`}>
                    Toko: {selectedSparepart.stock} {selectedSparepart.unit}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSparepart(null)}
                className="text-xs text-blue-600 hover:text-blue-700 shrink-0"
              >
                Ganti Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari sparepart (nama, SKU, brand, rak)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {loadingSpareparts ? (
                <div className="p-4 text-center text-xs text-slate-500">Memuat katalog sparepart...</div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredSpareparts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Tidak ada sparepart yang cocok</div>
                  ) : (
                    filteredSpareparts.map((sp) => {
                      const avail = type === 'WAREHOUSE_TO_STORE' ? sp.warehouseStock : sp.stock
                      const isZero = avail <= 0
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          disabled={isZero}
                          onClick={() => handleSelectSparepart(sp)}
                          className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                            isZero
                              ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                              : 'hover:bg-blue-50/50 cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-900 truncate">{sp.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {sp.sku ? `SKU: ${sp.sku} ` : ''}{sp.etalase ? `| Rak: ${sp.etalase}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono text-[11px]">
                            <p className={`font-bold ${isZero ? 'text-red-500' : 'text-slate-800'}`}>
                              {type === 'WAREHOUSE_TO_STORE' ? `Gudang: ${sp.warehouseStock}` : `Toko: ${sp.stock}`} {sp.unit}
                            </p>
                            <p className="text-slate-400">
                              {type === 'WAREHOUSE_TO_STORE' ? `(Toko: ${sp.stock})` : `(Gudang: ${sp.warehouseStock})`}
                            </p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Quantity & Quick Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Jumlah Transfer
            </label>
            {selectedSparepart && (
              <span className="text-xs font-mono text-slate-500">
                Tersedia di {type === 'WAREHOUSE_TO_STORE' ? 'Gudang' : 'Toko'}: <strong className="text-slate-800">{maxAvailable} {selectedSparepart.unit}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={maxAvailable > 0 ? maxAvailable : 1}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                setQuantity(isNaN(val as number) ? '' : val)
              }}
              placeholder="Jumlah unit..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedSparepart && (
              <span className="text-sm font-medium text-slate-600 font-mono">{selectedSparepart.unit}</span>
            )}
          </div>

          {/* Quick preset buttons */}
          {selectedSparepart && maxAvailable > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1">Cepat:</span>
              {[5, 10, 20].filter(n => n <= maxAvailable).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  +{n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantity(maxAvailable)}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 ml-auto"
              >
                Pindahkan Semua ({maxAvailable})
              </button>
            </div>
          )}
        </div>

        {/* Step 4: Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Catatan / Keterangan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Restock etalase kasir depan, persiapan event promo, dll."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Notification */}
        {status && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 animate-fade-in ${
              status.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {status.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <p className="text-xs font-semibold">{status.message}</p>
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={ArrowRightLeft}
            loading={isPending}
            disabled={!selectedSparepart || !quantity || Number(quantity) <= 0 || Number(quantity) > maxAvailable}
          >
            Konfirmasi Transfer
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
