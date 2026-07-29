'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createIndentOrder, type IndentPayload } from '@/actions/indent'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, Search, Package, Plus, PackagePlus, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface NewIndentClientProps {
  branches: { id: string; name: string }[]
  spareparts: { id: string; name: string; sku: string | null; branchId: string; stock: number; buyPrice: number }[]
  customers: { id: string; name: string }[]
}

export default function NewIndentClient({ branches, spareparts, customers }: NewIndentClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const base = pathname.startsWith('/kasir') ? '/kasir' : '/admin'
  const [isPending, startTransition] = useTransition()

  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [customerId, setCustomerId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedDate, setExpectedDate] = useState('')
  const [dpAmount, setDpAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<{ id: string; sparepartId: string | null; isManual?: boolean; name: string; sku: string | null; quantity: number; estimatedPrice: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPoInfo, setShowPoInfo] = useState(false)

  // Quick-add manual item form (langsung di form utama, tidak perlu modal)
  const [quickManualName, setQuickManualName] = useState('')
  const [quickManualSku, setQuickManualSku] = useState('')
  const [quickManualQty, setQuickManualQty] = useState('1')
  const [quickManualEstimatedPrice, setQuickManualEstimatedPrice] = useState('')

  const branchSpareparts = useMemo(() => {
    if (!branchId) return spareparts
    return spareparts.filter(sp => sp.branchId === branchId)
  }, [spareparts, branchId])

  const [selectedSparepartId, setSelectedSparepartId] = useState<string | null>(null)

  const manualNameSuggestions = useMemo(() => {
    if (!quickManualName || quickManualName.trim().length < 2) return []
    const lowerQ = quickManualName.toLowerCase()
    return branchSpareparts.filter(sp =>
      sp.name.toLowerCase().includes(lowerQ) ||
      (sp.sku && sp.sku.toLowerCase().includes(lowerQ))
    ).slice(0, 5)
  }, [quickManualName, branchSpareparts])

  const handleSelectSuggestion = (sp: typeof branchSpareparts[0]) => {
    setQuickManualName(sp.name)
    setQuickManualSku(sp.sku || '')
    setQuickManualEstimatedPrice(String(sp.buyPrice || 0))
    setSelectedSparepartId(sp.id)
  }

  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const lowerQ = searchQuery.toLowerCase()
    return branchSpareparts.filter(sp =>
      sp.name.toLowerCase().includes(lowerQ) ||
      (sp.sku && sp.sku.toLowerCase().includes(lowerQ))
    ).slice(0, 5)
  }, [searchQuery, branchSpareparts])

  const estimatedTotal = items.reduce((acc, i) => acc + (i.quantity * i.estimatedPrice), 0)

  const handleAddItem = (sp: typeof branchSpareparts[0]) => {
    const existingIndex = items.findIndex(i => i.sparepartId === sp.id)
    if (existingIndex >= 0) {
      const newItems = [...items]
      newItems[existingIndex].quantity += 1
      setItems(newItems)
    } else {
      setItems([...items, {
        id: crypto.randomUUID(),
        sparepartId: sp.id,
        name: sp.name,
        sku: sp.sku,
        quantity: 1,
        estimatedPrice: sp.buyPrice || 0,
      }])
    }
    setSearchQuery('')
  }

  // Tambah barang manual langsung dari form (tanpa modal) — fitur utama
  const handleAddManualFromForm = () => {
    const name = quickManualName.trim()
    const estimatedPrice = parseFloat(quickManualEstimatedPrice) || 0
    const quantity = parseInt(quickManualQty) || 1

    if (!name) {
      setError('Nama barang manual wajib diisi.')
      return
    }
    if (estimatedPrice < 0 || quantity < 1) {
      setError('Pastikan harga dan qty valid (tidak negatif).')
      return
    }

    setItems([...items, {
      id: crypto.randomUUID(),
      sparepartId: selectedSparepartId,
      isManual: !selectedSparepartId,
      name,
      sku: quickManualSku.trim() || null,
      quantity,
      estimatedPrice,
    }])

    // Reset semua field manual setelah barang ditambahkan ke PO.
    setQuickManualName('')
    setQuickManualSku('')
    setQuickManualQty('1')
    setQuickManualEstimatedPrice('')
    setSelectedSparepartId(null)
    setError(null)
  }

  const handleUpdateItem = (index: number, field: 'quantity' | 'estimatedPrice' | 'name' | 'sku', value: string | number) => {
    if (typeof value === 'number' && value < 0) return
    const newItems = [...items]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(newItems[index] as any)[field] = value
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!supplierName) { setError('Nama supplier wajib diisi.'); return }
    if (items.length === 0) { setError('Pilih minimal satu barang.'); return }
    setError(null)

    startTransition(async () => {
      const payload: IndentPayload = {
        branchId,
        supplierName,
        orderDate,
        expectedDate: expectedDate || null,
        notes: notes || null,
        dpAmount,
        type: 'CUSTOMER',
        customerId: customerId || null,
        items: items.map(i => ({
          sparepartId: i.sparepartId || null,
          isManual: i.isManual,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          estimatedPrice: i.estimatedPrice,
        })),
      }

      const res = await createIndentOrder(payload)
      if (res.success) {
        router.push(`${base}/indent`)
      } else {
        setError(res.message || 'Gagal menyimpan pesanan')
      }
    })
  }

  const selectedBranchName = branches.find(b => b.id === branchId)?.name || 'Cabang'

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`${base}/indent`}>
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0 rounded-xl" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Indent Baru</h1>
          <p className="text-sm text-slate-500">Catat pemesanan sparepart yang belum tersedia</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ============================================================
          SECTION 1: PO INFO — Compact ribbon (collapsible)
         ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPoInfo(!showPoInfo)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold text-slate-900">Informasi Pesanan</h2>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{supplierName || 'Supplier belum dipilih'}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{selectedBranchName}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{new Date(orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
          {showPoInfo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showPoInfo && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className={`grid grid-cols-1 ${branches.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {branches.length > 0 && (
                <Select
                  label="Cabang Pemesan"
                  options={branches.map(b => ({ label: b.name, value: b.id }))}
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value)
                    setItems([]) // Reset items if branch changes because spareparts are branch specific
                  }}
                />
              )}
              <Input
                label="Nama Supplier"
                placeholder="Contoh: PT. Astra Honda Motor"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
              <Input
                type="date"
                label="Tanggal Pesan"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Estimasi Tiba (Opsional)"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              <Input
                type="number"
                label="Jumlah DP / Dibayar (Opsional)"
                placeholder="0"
                value={dpAmount.toString()}
                onChange={(e) => setDpAmount(parseFloat(e.target.value) || 0)}
              />
              <Select
                label="Pelanggan (Opsional)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={[
                  { value: '', label: '-- Pilih Pelanggan --' },
                  ...customers.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Catatan Tambahan"
                placeholder="Keterangan tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          SECTION 2: QUICK MANUAL FORM — The hero feature
         ============================================================ */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200/60 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                <PackagePlus className="w-4 h-4" />
              </div>
              Input Barang Manual
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Baru / Belum Terdaftar</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 ml-9">
              Tambahkan sparepart baru ke pesanan indent. Barang otomatis terdaftar di sistem saat pesanan disimpan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              id="quick-manual-name"
              type="text"
              placeholder="Contoh: Kampas Rem Depan Vario LED"
              value={quickManualName}
              onChange={(e) => {
                setQuickManualName(e.target.value)
                setSelectedSparepartId(null)
              }}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {manualNameSuggestions.length > 0 && !selectedSparepartId && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                <div className="p-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Master Sparepart Ditemukan
                </div>
                <div className="divide-y divide-slate-50">
                  {manualNameSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 group-hover:text-emerald-700 truncate">
                          {item.name}
                        </p>
                        {item.sku && <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                        Pilih
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">SKU</label>
            <input
              type="text"
              placeholder="KVB-900"
              value={quickManualSku}
              onChange={(e) => setQuickManualSku(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Qty</label>
            <input
              type="number"
              min="1"
              value={quickManualQty}
              onChange={(e) => setQuickManualQty(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Harga Estimasi</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quickManualEstimatedPrice}
                onChange={(e) => setQuickManualEstimatedPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={handleAddManualFromForm}
              icon={Plus}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25"
            >
              Tambah
            </Button>
          </div>
        </div>

        {/* Quick search bar (compact, alternative) */}
        <div className="mt-4 pt-4 border-t border-emerald-200/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Atau cari sparepart yang sudah ada di cabang ini..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />

            {searchQuery && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700 truncate">
                              {item.name}
                            </p>
                            {item.sku && <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[10px] text-slate-400">Stok: {item.stock}</p>
                          <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                            + Tambah
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs text-slate-500">
                      Tidak ditemukan. Coba pakai form Input Barang Manual di atas ☝️
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          SECTION 3: RINCIAN BARANG — Table
         ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Daftar Barang Dipesan
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h3>
          {items.length > 0 && (
            <span className="text-xs text-slate-500">
              <span className="hidden sm:inline">Estimasi total: </span>
              <span className="font-bold text-slate-900">{formatCurrency(estimatedTotal)}</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Sparepart</th>
                <th className="px-2 py-2.5 w-20 text-center">Qty</th>
                <th className="px-2 py-2.5 w-32 text-right">Harga Estimasi</th>
                <th className="px-4 py-2.5 w-32 text-right">Subtotal</th>
                <th className="px-2 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 mt-2">Belum ada barang</p>
                      <p className="text-xs text-slate-400">Tambahkan barang via Input Barang Manual atau Cari Barang di atas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.isManual ? (
                          <input
                            type="text"
                            className="bg-transparent border-b border-dashed border-slate-300 hover:border-primary-400 focus:border-primary-500 focus:border-solid outline-none px-1 min-w-[160px] max-w-full text-slate-900 font-medium"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                            title="Edit nama barang"
                          />
                        ) : (
                          <span className="line-clamp-1 break-all">{item.name}</span>
                        )}
                        {item.isManual && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                            Manual
                          </span>
                        )}
                      </div>
                      {item.isManual ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            placeholder="SKU"
                            className="text-[10px] bg-transparent border-b border-dashed border-slate-300 hover:border-primary-400 focus:border-primary-500 focus:border-solid outline-none px-1 w-20 text-slate-500 font-normal"
                            value={item.sku || ''}
                            onChange={(e) => handleUpdateItem(index, 'sku', e.target.value)}
                            title="Edit SKU"
                          />
                        </div>
                      ) : (
                        item.sku && <p className="text-[10px] text-slate-400 font-normal mt-1 px-1">{item.sku}</p>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-white border border-slate-200 rounded-lg text-center px-1 py-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-white border border-slate-200 rounded-lg text-right px-2 py-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        value={item.estimatedPrice}
                        onChange={(e) => handleUpdateItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.quantity * item.estimatedPrice)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-end gap-4 justify-between">
            <div className="flex flex-col gap-2 w-full sm:w-80">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estimasi Total</span>
              </div>
              <p className="text-2xl font-black text-slate-900 -mt-1">{formatCurrency(estimatedTotal)}</p>

              <div className="flex items-end gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    label="Jumlah DP (Dibayar)"
                    value={dpAmount.toString()}
                    onChange={(e) => setDpAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="pb-1">
                  {dpAmount >= estimatedTotal && estimatedTotal > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-2 rounded-lg">
                      ✓ LUNAS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-100 px-3 py-2 rounded-lg">
                      ! HUTANG
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              icon={Plus}
              onClick={handleSubmit}
              loading={isPending}
              disabled={items.length === 0}
              className="shadow-lg shadow-primary-500/25 px-8 w-full sm:w-auto"
            >
              Simpan Pesanan
            </Button>
          </div>
        )}

        {items.length === 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-right">
            <Button
              size="lg"
              icon={Plus}
              onClick={handleSubmit}
              loading={isPending}
              disabled={items.length === 0}
              className="shadow-lg shadow-primary-500/25 px-8 w-full sm:w-auto"
            >
              Simpan Pesanan
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}