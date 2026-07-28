'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createRestock, type RestockPayload } from '@/actions/restock'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, Search, Package, Plus, Upload, X, PackagePlus, FileText, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface NewRestockClientProps {
  branches: { id: string; name: string }[]
  spareparts: { id: string; name: string; sku: string | null; branchId: string; stock: number; buyPrice: number }[]
}

export default function NewRestockClient({ branches, spareparts }: NewRestockClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [supplierName, setSupplierName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedDate, setExpectedDate] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [receiptImagePath, setReceiptImagePath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [items, setItems] = useState<{ id: string; sparepartId: string | null; isNew?: boolean; name: string; sku: string | null; quantity: number; buyPrice: number; sellPrice?: number }[]>([])

  // Quick-add manual item form (langsung di form utama, tidak perlu modal)
  const [quickManualName, setQuickManualName] = useState('')
  const [quickManualSku, setQuickManualSku] = useState('')
  const [quickManualBuyPrice, setQuickManualBuyPrice] = useState('')
  const [quickManualSellPrice, setQuickManualSellPrice] = useState('')
  const [quickManualQty, setQuickManualQty] = useState('1')

  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPoInfo, setShowPoInfo] = useState(false)

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadingReceipt(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/receipt', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Gagal mengupload foto')
      } else {
        setReceiptImagePath(data.path)
        setReceiptPreview(URL.createObjectURL(file))
      }
    } catch {
      setUploadError('Gagal mengupload foto')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptImagePath(null)
    setReceiptPreview(null)
  }

  // Filter spareparts by selected branch for the search dropdown
  const branchSpareparts = useMemo(() => {
    return spareparts.filter(sp => sp.branchId === branchId)
  }, [spareparts, branchId])

  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const lowerQ = searchQuery.toLowerCase()
    return branchSpareparts.filter(sp =>
      sp.name.toLowerCase().includes(lowerQ) ||
      (sp.sku && sp.sku.toLowerCase().includes(lowerQ))
    ).slice(0, 5)
  }, [searchQuery, branchSpareparts])

  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.buyPrice), 0)

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
        buyPrice: sp.buyPrice || 0
      }])
    }
    setSearchQuery('')
  }

  // Tambah barang manual langsung dari form (tanpa modal) — fitur utama
  const handleAddManualFromForm = () => {
    const name = quickManualName.trim()
    const buyPrice = parseFloat(quickManualBuyPrice) || 0
    const sellPrice = parseFloat(quickManualSellPrice) || 0
    const quantity = parseInt(quickManualQty) || 1

    if (!name) {
      setError('Nama barang manual wajib diisi.')
      return
    }
    if (buyPrice < 0 || sellPrice < 0 || quantity < 1) {
      setError('Pastikan harga dan qty valid (tidak negatif).')
      return
    }

    setItems([...items, {
      id: crypto.randomUUID(),
      sparepartId: null,
      isNew: true,
      name,
      sku: quickManualSku.trim() || null,
      buyPrice,
      sellPrice,
      quantity
    }])

    // Reset semua field manual setelah barang ditambahkan ke PO.
    setQuickManualName('')
    setQuickManualSku('')
    setQuickManualQty('1')
    setQuickManualBuyPrice('')
    setQuickManualSellPrice('')
    setError(null)
  }

  const handleUpdateItem = (index: number, field: 'quantity' | 'buyPrice' | 'sellPrice' | 'name' | 'sku', value: string | number) => {
    if (typeof value === 'number' && value < 0) return
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value as string & number }
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Pilih minimal satu barang.')
      return
    }
    if (!supplierName) {
      setError('Nama supplier wajib diisi.')
      return
    }

    setError(null)
    startTransition(async () => {
      const payload: RestockPayload = {
        branchId,
        supplierName,
        date,
        expectedDate: expectedDate || null,
        paidAmount,
        notes: notes || null,
        receiptImagePath: receiptImagePath || null,
        items: items.map(i => ({
          sparepartId: i.sparepartId || null,
          isNew: i.isNew,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          buyPrice: i.buyPrice,
          sellPrice: i.sellPrice
        }))
      }

      const res = await createRestock(payload)
      if (res.success) {
        router.push('/admin/restock')
      } else {
        setError(res.message || 'Gagal menyimpan data')
      }
    })
  }

  const selectedBranchName = branches.find(b => b.id === branchId)?.name || 'Cabang'

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/restock">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0 rounded-xl" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Order Baru</h1>
          <p className="text-sm text-slate-500">Catat penerimaan barang masuk dari supplier</p>
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
              <h2 className="text-base font-semibold text-slate-900">Informasi PO</h2>
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{supplierName || 'Supplier belum dipilih'}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{selectedBranchName}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
          {showPoInfo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showPoInfo && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Cabang Penerima"
                options={branches.map(b => ({ label: b.name, value: b.id }))}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value)
                  setItems([]) // Reset items if branch changes because spareparts are branch specific
                }}
              />
              <Input
                label="Nama Supplier"
                placeholder="Contoh: PT. Astra Honda Motor"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
              <Input
                type="date"
                label="Tanggal Masuk / Pesan"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Estimasi Kedatangan (Opsional)"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
              <Input
                label="Catatan Tambahan"
                placeholder="No. Surat Jalan / Keterangan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Foto Nota Pembelian
                  <span className="text-xs text-slate-400 font-normal ml-1">(opsional, maks. 5 MB)</span>
                </label>
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white h-[42px] flex items-center px-3">
                    <span className="text-xs text-slate-700 truncate flex-1">📎 Foto terupload</span>
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-[42px] border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-white hover:bg-slate-50 hover:border-primary-300 transition-all">
                    {uploadingReceipt ? (
                      <span className="text-xs text-slate-500">Mengupload...</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Upload foto (JPG/PNG)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                    />
                  </label>
                )}
                {uploadError && (
                  <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                )}
              </div>
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
              Tambahkan sparepart baru ke PO. Barang otomatis terdaftar di <strong>Stock Gudang</strong> sesuai qty, dapat dipindahkan ke Toko via menu Stock Transfer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              id="quick-manual-name"
              type="text"
              placeholder="Contoh: Kampas Rem Depan Vario LED"
              value={quickManualName}
              onChange={(e) => setQuickManualName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Harga Beli</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quickManualBuyPrice}
                onChange={(e) => setQuickManualBuyPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Harga Jual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quickManualSellPrice}
                onChange={(e) => setQuickManualSellPrice(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="md:col-span-1">
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
            <Truck className="w-4 h-4 text-slate-500" />
            Rincian Barang
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h3>
          {items.length > 0 && (
            <span className="text-xs text-slate-500">
              <span className="hidden sm:inline">Estimasi total: </span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Sparepart</th>
                <th className="px-2 py-2.5 w-20 text-center">Qty</th>
                <th className="px-2 py-2.5 w-32 text-right">Harga Beli</th>
                <th className="px-2 py-2.5 w-32 text-right">Harga Jual</th>
                <th className="px-4 py-2.5 w-32 text-right">Subtotal</th>
                <th className="px-2 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
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
                        {item.isNew ? (
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
                        {item.isNew && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                            Baru
                          </span>
                        )}
                      </div>
                      {item.isNew ? (
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
                        value={item.buyPrice}
                        onChange={(e) => handleUpdateItem(index, 'buyPrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-3">
                      {item.isNew ? (
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-amber-50 border border-amber-200 rounded-lg text-right px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                          value={item.sellPrice || 0}
                          onChange={(e) => handleUpdateItem(index, 'sellPrice', parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-slate-400 italic text-[10px] block text-right">— (Master)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.quantity * item.buyPrice)}
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
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pembelian</span>
              </div>
              <p className="text-2xl font-black text-slate-900 -mt-1">{formatCurrency(subtotal)}</p>

              <div className="flex items-end gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    label="Jumlah Dibayar (DP/Lunas)"
                    value={paidAmount.toString()}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="pb-1">
                  {paidAmount >= subtotal && subtotal > 0 ? (
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
              Simpan PO
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
              Simpan PO
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}