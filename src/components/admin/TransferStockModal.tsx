'use client'

import { useState, useEffect, useMemo, useTransition, useRef } from 'react'
import Modal from '@/components/ui/Modal'
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
  Layers,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  Sparkles
} from 'lucide-react'
import { createBulkStockTransfer, getSparepartsForTransfer } from '@/actions/stock-transfer'

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

interface CartItem {
  sparepart: TransferSparepart
  quantity: number
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
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Multi-item cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)

  // Reset & load on open
  useEffect(() => {
    if (open) {
      setType(initialType)
      setNotes('')
      setStatus(null)
      setSearchTerm('')
      setShowDropdown(false)

      // Fetch all spareparts for branch
      setLoadingSpareparts(true)
      getSparepartsForTransfer(selectedBranchId || undefined)
        .then((data) => {
          setSpareparts(data)
          // If initialSparepart was passed, add it directly to cart
          if (initialSparepart) {
            const fresh = data.find((sp) => sp.id === initialSparepart.id) || initialSparepart
            setCart([{ sparepart: fresh, quantity: 1 }])
          } else {
            setCart([])
          }
        })
        .finally(() => setLoadingSpareparts(false))
    }
  }, [open, initialSparepart, initialType, selectedBranchId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSpareparts = useMemo(() => {
    if (!searchTerm.trim()) return spareparts.slice(0, 25)
    const term = searchTerm.toLowerCase().trim()
    return spareparts.filter(
      (sp) =>
        sp.name.toLowerCase().includes(term) ||
        (sp.sku && sp.sku.toLowerCase().includes(term)) ||
        (sp.sparepartBrand && sp.sparepartBrand.toLowerCase().includes(term)) ||
        (sp.etalase && sp.etalase.toLowerCase().includes(term))
    ).slice(0, 35)
  }, [spareparts, searchTerm])

  const handleAddItemToCart = (sp: TransferSparepart) => {
    setStatus(null)
    const existingIndex = cart.findIndex((item) => item.sparepart.id === sp.id)
    const maxStock = type === 'WAREHOUSE_TO_STORE' ? sp.warehouseStock : sp.stock

    if (maxStock <= 0) {
      const source = type === 'WAREHOUSE_TO_STORE' ? 'gudang' : 'toko'
      setStatus({
        success: false,
        message: `Stok ${source} untuk "${sp.name}" kosong (0 ${sp.unit}). Tidak dapat ditransfer.`,
      })
      return
    }

    if (existingIndex >= 0) {
      const currentQty = cart[existingIndex].quantity
      if (currentQty >= maxStock) {
        setStatus({
          success: false,
          message: `Jumlah untuk "${sp.name}" sudah mencapai batas maksimum stok (${maxStock} ${sp.unit}).`,
        })
        return
      }
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCart((prev) => [...prev, { sparepart: sp, quantity: 1 }])
    }

    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const maxStock = type === 'WAREHOUSE_TO_STORE' ? item.sparepart.warehouseStock : item.sparepart.stock
        const validQty = Math.max(1, Math.min(newQty, maxStock))
        return { ...item, quantity: validQty }
      })
    )
  }

  const handleSetMaxQuantity = (index: number) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const maxStock = type === 'WAREHOUSE_TO_STORE' ? item.sparepart.warehouseStock : item.sparepart.stock
        return { ...item, quantity: Math.max(1, maxStock) }
      })
    )
  }

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleClearCart = () => {
    setCart([])
  }

  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  }, [cart])

  const hasInvalidItems = useMemo(() => {
    return cart.some((item) => {
      const maxStock = type === 'WAREHOUSE_TO_STORE' ? item.sparepart.warehouseStock : item.sparepart.stock
      return item.quantity <= 0 || item.quantity > maxStock
    })
  }, [cart, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      setStatus({ success: false, message: 'Pilih minimal 1 sparepart untuk ditransfer.' })
      return
    }

    if (hasInvalidItems) {
      setStatus({ success: false, message: 'Terdapat item dengan jumlah yang melebihi stok tersedia.' })
      return
    }

    startTransition(async () => {
      setStatus(null)
      const res = await createBulkStockTransfer({
        type,
        items: cart.map((i) => ({
          sparepartId: i.sparepart.id,
          quantity: i.quantity,
        })),
        notes: notes.trim() || undefined,
        branchId: selectedBranchId || undefined,
      })

      if (res.success) {
        setStatus({ success: true, message: res.message || 'Transfer stok massal berhasil!' })
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
      description="Pindahkan stok satu atau banyak item sparepart sekaligus secara cepat & aman"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-2">
        
        {/* Top Bar: Direction & Branch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Direction Switcher (8 cols) */}
          <div className={`${branches.length > 1 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
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
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  type === 'WAREHOUSE_TO_STORE'
                    ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  type === 'WAREHOUSE_TO_STORE' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm font-bold ${type === 'WAREHOUSE_TO_STORE' ? 'text-blue-900' : 'text-slate-800'}`}>
                    Gudang ➔ Toko
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
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  type === 'STORE_TO_WAREHOUSE'
                    ? 'border-purple-500 bg-purple-50/90 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  type === 'STORE_TO_WAREHOUSE' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm font-bold ${type === 'STORE_TO_WAREHOUSE' ? 'text-purple-900' : 'text-slate-800'}`}>
                    Toko ➔ Gudang
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">Retur / simpan ke gudang</p>
                </div>
              </button>
            </div>
          </div>

          {/* Branch Selector (if multiple branches) (4 cols) */}
          {branches.length > 1 && (
            <div className="lg:col-span-4 flex flex-col justify-end">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Cabang
              </label>
              <Select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>
          )}
        </div>

        {/* Search & Autocomplete Bar */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Cari &amp; Tambahkan Barang ke Antrean</span>
            <span className="text-[11px] font-normal text-slate-500 lowercase">
              (tersedia {spareparts.length} master barang)
            </span>
          </label>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama sparepart, kode SKU, merk, atau lokasi etalase..."
              value={searchTerm}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Autocomplete Dropdown List */}
          {showDropdown && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
              {loadingSpareparts ? (
                <div className="p-6 text-center text-xs text-slate-400">Memuat data sparepart...</div>
              ) : filteredSpareparts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada sparepart yang sesuai dengan &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                filteredSpareparts.map((sp) => {
                  const sourceStock = type === 'WAREHOUSE_TO_STORE' ? sp.warehouseStock : sp.stock
                  const destStock = type === 'WAREHOUSE_TO_STORE' ? sp.stock : sp.warehouseStock
                  const isOutOfStock = sourceStock <= 0
                  const isInCart = cart.some((item) => item.sparepart.id === sp.id)

                  return (
                    <button
                      key={sp.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddItemToCart(sp)}
                      className={`w-full p-3 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                        isOutOfStock
                          ? 'opacity-40 bg-slate-50/60 cursor-not-allowed'
                          : isInCart
                          ? 'bg-blue-50/40 hover:bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {sp.name}
                          </p>
                          {isInCart && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded shrink-0">
                              ✓ Di Antrean
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          {sp.sku && <span className="font-mono">SKU: {sp.sku}</span>}
                          {sp.sparepartBrand && <span>• Merk: {sp.sparepartBrand}</span>}
                          {sp.etalase && <span>• Rak: {sp.etalase}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-slate-800">
                          {type === 'WAREHOUSE_TO_STORE' ? (
                            <span>Stok Gudang: <strong className="text-blue-700">{sp.warehouseStock}</strong> {sp.unit}</span>
                          ) : (
                            <span>Stok Toko: <strong className="text-purple-700">{sp.stock}</strong> {sp.unit}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {type === 'WAREHOUSE_TO_STORE' ? `(Toko saat ini: ${destStock})` : `(Gudang saat ini: ${destStock})`}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Transfer Queue Table (Multi-Item Cart) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Daftar Barang yang Dipindahkan</span>
              <span className="text-xs font-normal text-slate-500">
                ({cart.length} item dipilih)
              </span>
            </h4>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer transition-colors"
              >
                Kosongkan Daftar
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum ada barang di antrean transfer</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gunakan kolom pencarian di atas untuk memilih dan memasukkan barang ke daftar transfer massal.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {cart.map((item, index) => {
                  const sp = item.sparepart
                  const sourceStock = type === 'WAREHOUSE_TO_STORE' ? sp.warehouseStock : sp.stock
                  const destStock = type === 'WAREHOUSE_TO_STORE' ? sp.stock : sp.warehouseStock
                  const afterSource = sourceStock - item.quantity
                  const afterDest = destStock + item.quantity
                  const isInvalid = item.quantity <= 0 || item.quantity > sourceStock

                  return (
                    <div
                      key={sp.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Left: Item Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {sp.name}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 pl-7 flex-wrap">
                          <span>
                            Stok Asal: <strong className="text-slate-800 font-mono">{sourceStock} {sp.unit}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            Simulasi Mutasi:{' '}
                            <span className="font-mono text-slate-700">
                              {type === 'WAREHOUSE_TO_STORE' ? 'Gudang' : 'Toko'} ({sourceStock} ➔ <strong>{afterSource}</strong>)
                            </span>
                            {' ➔ '}
                            <span className="font-mono text-blue-700 font-bold">
                              {type === 'WAREHOUSE_TO_STORE' ? 'Toko' : 'Gudang'} ({destStock} ➔ {afterDest})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity Controls & Quick Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pl-7 sm:pl-0 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={sourceStock}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 0)}
                            className={`w-16 text-center font-bold font-mono text-xs sm:text-sm bg-transparent outline-none ${
                              isInvalid ? 'text-red-600 font-black' : 'text-slate-900'
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                            disabled={item.quantity >= sourceStock}
                            className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSetMaxQuantity(index)}
                          className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors shrink-0"
                          title="Transfer semua stok yang tersedia"
                        >
                          Maks ({sourceStock})
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cart Summary Bar */}
              <div className="bg-slate-50 p-3.5 sm:px-5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600">
                  Ringkasan Pemindahan:
                </span>
                <span className="font-bold text-slate-900">
                  <strong className="text-blue-700 font-mono text-sm">{cart.length}</strong> Jenis Sparepart • <strong className="text-blue-700 font-mono text-sm">{totalUnits}</strong> Total Unit
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Catatan Pemindahan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Pengisian display etalase depan, restock oli mingguan..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Feedback Alert */}
        {status && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm ${
              status.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {status.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={cart.length === 0 || hasInvalidItems}
            icon={ArrowRightLeft}
            className="w-full sm:w-auto text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending
              ? 'Memproses Mutasi...'
              : `Proses Transfer (${cart.length} Barang / ${totalUnits} Unit)`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
