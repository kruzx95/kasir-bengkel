'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createRestock, type RestockPayload } from '@/actions/restock'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, Search, Package, Plus, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
  const [notes, setNotes] = useState('')
  const [receiptImagePath, setReceiptImagePath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const [items, setItems] = useState<{ id: string; sparepartId: string; name: string; sku: string | null; quantity: number; buyPrice: number }[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  const handleUpdateItem = (index: number, field: 'quantity' | 'buyPrice', value: number) => {
    if (value < 0) return
    const newItems = [...items]
    newItems[index][field] = value
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
        notes: notes || null,
        receiptImagePath: receiptImagePath || null,
        items: items.map(i => ({
          sparepartId: i.sparepartId,
          quantity: i.quantity,
          buyPrice: i.buyPrice
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/restock">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Input PO Baru</h1>
          <p className="text-sm text-slate-500">Catat penerimaan barang masuk dari supplier</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Master Data PO */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi PO</h2>
            
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
              label="Tanggal Masuk"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Input
              label="Catatan Tambahan"
              placeholder="No. Surat Jalan / Keterangan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* Upload Foto Nota */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Foto Nota Pembelian
                <span className="text-xs text-slate-400 font-normal ml-1">(opsional, maks. 5 MB)</span>
              </label>

              {receiptPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    src={receiptPreview}
                    alt="Foto nota"
                    width={400}
                    height={300}
                    className="w-full object-contain max-h-48"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary-300 transition-all">
                  {uploadingReceipt ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                      <span className="text-sm">Mengupload...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-sm text-slate-500">Klik untuk upload foto nota</span>
                      <span className="text-xs text-slate-400">JPG, PNG</span>
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
                <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-visible relative">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-500" /> Cari Barang di Cabang Ini
            </h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama sparepart atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
              
              {searchQuery && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 group-hover:text-primary-700">
                                {item.name}
                              </p>
                              {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-slate-400 mb-0.5">Stok Saat Ini: {item.stock}</p>
                             <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                               + Tambah
                             </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Tidak ditemukan sparepart untuk pencarian ini di cabang terpilih.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-semibold text-slate-900">Rincian Barang Masuk</h3>
               <span className="text-sm font-bold text-primary-600">{items.length} Jenis Barang</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Sparepart</th>
                    <th className="px-4 py-3 w-32">Qty (Pcs)</th>
                    <th className="px-4 py-3 w-40">Harga Beli Satuan</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Belum ada barang yang ditambahkan.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.name}
                          {item.sku && <p className="text-xs text-slate-400 font-normal">{item.sku}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            min="1"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            min="0"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                            value={item.buyPrice}
                            onChange={(e) => handleUpdateItem(index, 'buyPrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.buyPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Pembelian</p>
                 <p className="text-2xl font-black text-slate-900">{formatCurrency(subtotal)}</p>
              </div>
              <Button
                size="lg"
                icon={Plus}
                onClick={handleSubmit}
                loading={isPending}
                disabled={items.length === 0}
                className="shadow-lg shadow-primary-500/25 px-8"
              >
                Simpan PO
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
