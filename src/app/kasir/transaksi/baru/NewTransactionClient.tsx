'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { createTransaction, type TransactionPayload } from '@/actions/transaction'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Search, ArrowLeft, Receipt, Wrench, Package, User, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const DRAFT_KEY = 'irian_motor_tx_draft'

interface DraftState {
  customerId: string
  isCorporate: boolean
  items: TransactionPayload['items']
  discount: number
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS'
  mechanicId: string
  notes: string
}

const defaultDraft: DraftState = {
  customerId: '',
  isCorporate: false,
  items: [],
  discount: 0,
  paymentMethod: 'CASH',
  mechanicId: '',
  notes: '',
}

function loadDraft(): DraftState {
  if (typeof window === 'undefined') return defaultDraft
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return defaultDraft
    return { ...defaultDraft, ...JSON.parse(raw) }
  } catch {
    return defaultDraft
  }
}

function saveDraft(state: DraftState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

interface ItemData {
  id: string
  name: string
  price: number
  type: 'SERVICE' | 'SPAREPART'
  stock?: number
}

interface NewTransactionClientProps {
  customers: { id: string; name: string; plateNumber: string | null; corporateCustomerId: string | null }[]
  services: { id: string; name: string; price: number }[]
  spareparts: { id: string; name: string; sellPrice: number; stock: number; sku: string | null }[]
  mechanics?: { id: string; name: string }[]
}

export default function NewTransactionClient({
  customers,
  services,
  spareparts,
  mechanics = [],
}: NewTransactionClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Load dari draft saat pertama render
  const [customerId, setCustomerId] = useState<string>(() => loadDraft().customerId)
  const [isCorporate, setIsCorporate] = useState<boolean>(() => loadDraft().isCorporate)
  const [items, setItems] = useState<TransactionPayload['items']>(() => loadDraft().items)
  const [discount, setDiscount] = useState<number>(() => loadDraft().discount)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>(() => loadDraft().paymentMethod)
  const [mechanicId, setMechanicId] = useState<string>(() => loadDraft().mechanicId)
  const [notes, setNotes] = useState<string>(() => loadDraft().notes)
  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return false
    try { return (JSON.parse(raw) as DraftState).items.length > 0 } catch { return false }
  })

  // Auto-save ke localStorage setiap kali state berubah
  useEffect(() => {
    const draft: DraftState = { customerId, isCorporate, items, discount, paymentMethod, mechanicId, notes }
    saveDraft(draft)
    setHasDraft(items.length > 0)
  }, [customerId, isCorporate, items, discount, paymentMethod, mechanicId, notes])

  const handleResetDraft = () => {
    if (!confirm('Hapus semua item dan mulai transaksi baru?')) return
    clearDraft()
    setCustomerId('')
    setIsCorporate(false)
    setItems([])
    setDiscount(0)
    setPaymentMethod('CASH')
    setMechanicId('')
    setNotes('')
    setHasDraft(false)
  }

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Detect if selected customer is corporate
  const selectedCustomer = customers.find(c => c.id === customerId)
  const isSelectedCorporate = !!selectedCustomer?.corporateCustomerId
  const catalog = useMemo(() => {
    const s: ItemData[] = services.map(s => ({ id: s.id, name: s.name, price: s.price, type: 'SERVICE' }))
    const sp: ItemData[] = spareparts.map(sp => ({ 
      id: sp.id, 
      name: `${sp.name} ${sp.sku ? `(${sp.sku})` : ''}`, 
      price: sp.sellPrice, 
      type: 'SPAREPART',
      stock: sp.stock
    }))
    return [...s, ...sp]
  }, [services, spareparts])

  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const lowerQ = searchQuery.toLowerCase()
    return catalog.filter(item => item.name.toLowerCase().includes(lowerQ)).slice(0, 5)
  }, [searchQuery, catalog])

  // Computed Totals
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0)
  const total = Math.max(0, subtotal - discount)

  const handleAddItem = (item: ItemData) => {
    if (item.type === 'SPAREPART' && item.stock && item.stock <= 0) {
      alert('Stok sparepart habis!')
      return
    }

    const existingItemIndex = items.findIndex(i => i.itemId === item.id)
    if (existingItemIndex >= 0) {
      const newItems = [...items]
      const currQty = newItems[existingItemIndex].quantity
      
      if (item.type === 'SPAREPART' && item.stock && currQty >= item.stock) {
        alert('Melebihi stok yang tersedia!')
        return
      }
      
      newItems[existingItemIndex].quantity += 1
      setItems(newItems)
    } else {
      setItems([...items, {
        itemType: item.type,
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price
      }])
    }
    setSearchQuery('')
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return
    const item = items[index]
    
    if (item.itemType === 'SPAREPART') {
      const sp = spareparts.find(s => s.id === item.itemId)
      if (sp && newQty > sp.stock) {
        alert(`Maksimal stok: ${sp.stock}`)
        return
      }
    }

    const newItems = [...items]
    newItems[index].quantity = newQty
    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Pilih minimal satu item untuk transaksi.')
      return
    }

    setError(null)
    startTransition(async () => {
      const payload: TransactionPayload = {
        customerId: customerId || null,
        mechanicId: mechanicId || null,
        items,
        discount,
        paymentMethod,
        notes: notes || null,
        isCorporate: isSelectedCorporate && isCorporate,
      }
      
      const res = await createTransaction(payload)
      if (res.success) {
        clearDraft()
        router.push(`/kasir/transaksi/${res.invoiceNumber || ''}`)
      } else {
        setError(res.message || 'Gagal membuat transaksi')
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/kasir/transaksi">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Transaksi Baru</h1>
          <p className="text-xs sm:text-sm text-slate-500">Buat invoice untuk layanan atau penjualan</p>
        </div>
        {hasDraft && (
          <button
            onClick={handleResetDraft}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {/* Banner draft tersimpan */}
      {hasDraft && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          Draft tersimpan — transaksi dilanjutkan dari sesi sebelumnya
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-500" /> Cari Servis / Sparepart
            </h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama barang atau jasa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
              
              {searchQuery && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              item.type === 'SERVICE' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {item.type === 'SERVICE' ? <Wrench className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 transition-colors">
                                {item.name}
                              </p>
                              {item.type === 'SPAREPART' && (
                                <p className={`text-xs ${item.stock === 0 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                  Stok: {item.stock}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {formatCurrency(item.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Tidak ditemukan hasil untuk "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-500" /> Detail Item
              </h2>
              <Badge variant="primary" size="md">{items.length} item</Badge>
            </div>
            
            {items.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
                <p className="text-sm text-slate-400 mt-1">Cari dan tambahkan item di atas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {items.map((item, index) => (
                  <div key={`${item.itemId}-${index}`} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.itemName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(item.unitPrice)} / {item.itemType === 'SERVICE' ? 'jasa' : 'pcs'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                        <button 
                          onClick={() => handleUpdateQty(index, item.quantity - 1)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >-</button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(index, item.quantity + 1)}
                          className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >+</button>
                      </div>
                      
                      <div className="w-24 sm:w-32 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Checkout & Customer */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" /> Informasi Pelanggan
            </h2>
            
            <Select
              id="customer"
              name="customer"
              label="Pelanggan (Opsional)"
              options={[
                { label: 'Pelanggan Umum (Tanpa Nama)', value: '' },
                ...customers.map(c => ({
                  label: `${c.name} ${c.plateNumber ? `- ${c.plateNumber}` : ''}`,
                  value: c.id
                }))
              ]}
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setIsCorporate(false)
              }}
            />

            {/* Corporate billing toggle */}
            {isSelectedCorporate && (
              <label className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl cursor-pointer hover:bg-violet-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isCorporate}
                  onChange={(e) => setIsCorporate(e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <div>
                  <p className="text-sm font-medium text-violet-900">Tagihan Korporat</p>
                  <p className="text-xs text-violet-600">Pembayaran akan digabung dengan tagihan perusahaan</p>
                </div>
              </label>
            )}

            <Select
              id="mechanic"
              name="mechanic"
              label="Mekanik Penanggung Jawab (Opsional)"
              options={[
                { label: 'Tidak ada / Hanya Beli Sparepart', value: '' },
                ...mechanics.map(m => ({ label: m.name, value: m.id }))
              ]}
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
            />
            
            <div className="pt-2 border-t border-slate-100 mt-4 space-y-4">
              <Input
                id="notes"
                name="notes"
                label="Catatan Mekanik / Keluhan"
                placeholder="Contoh: Rantai berisik, minta di-setting..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
               Ringkasan Pembayaran
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex items-center justify-between text-slate-400">
                <span>Diskon (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-right text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="my-6 border-t border-slate-800"></div>
            
            <div className="flex justify-between items-end mb-6">
              <span className="text-slate-400">Total Akhir</span>
              <span className="text-3xl font-bold text-emerald-400">{formatCurrency(total)}</span>
            </div>
            
            <div className="space-y-2 mb-6">
              <p className="text-xs text-slate-400 font-medium">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'TRANSFER', 'QRIS'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all border ${
                      paymentMethod === method 
                        ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/50' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full py-4 text-base font-bold shadow-xl shadow-primary-900/50"
              onClick={handleSubmit}
              loading={isPending}
              disabled={items.length === 0}
            >
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
