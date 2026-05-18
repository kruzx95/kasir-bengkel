'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { createIndentOrder, type IndentPayload } from '@/actions/indent'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trash2, Search, Package, Plus, ClipboardList } from 'lucide-react'
import Link from 'next/link'

interface NewIndentClientProps {
  branches: { id: string; name: string }[]
  spareparts: { id: string; name: string; sku: string | null; branchId: string; stock: number; buyPrice: number }[]
}

export default function NewIndentClient({ branches, spareparts }: NewIndentClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [supplierName, setSupplierName] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<{ id: string; sparepartId: string; name: string; sku: string | null; quantity: number; estimatedPrice: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const branchSpareparts = useMemo(() =>
    spareparts.filter(sp => sp.branchId === branchId),
    [spareparts, branchId]
  )

  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return branchSpareparts
      .filter(sp => sp.name.toLowerCase().includes(q) || (sp.sku && sp.sku.toLowerCase().includes(q)))
      .slice(0, 5)
  }, [searchQuery, branchSpareparts])

  const estimatedTotal = items.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0)

  const handleAddItem = (sp: typeof branchSpareparts[0]) => {
    const existing = items.findIndex(i => i.sparepartId === sp.id)
    if (existing >= 0) {
      const updated = [...items]
      updated[existing].quantity += 1
      setItems(updated)
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

  const handleUpdateItem = (index: number, field: 'quantity' | 'estimatedPrice', value: number) => {
    if (value < 0) return
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
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
        items: items.map(i => ({
          sparepartId: i.sparepartId,
          quantity: i.quantity,
          estimatedPrice: i.estimatedPrice,
        })),
      }

      const res = await createIndentOrder(payload)
      if (res.success) {
        router.push('/admin/indent')
      } else {
        setError(res.message || 'Gagal menyimpan pesanan')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/indent">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Indent Baru</h1>
          <p className="text-sm text-slate-500">Catat pemesanan sparepart yang belum tersedia</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Pesanan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-500" />
            Informasi Pesanan
          </h2>

          <Select
            label="Cabang"
            options={branches.map(b => ({ label: b.name, value: b.id }))}
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setItems([]) }}
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
            label="Tanggal Pesan"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            required
          />

          <Input
            type="date"
            label="Estimasi Tiba"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />

          <Input
            label="Catatan"
            placeholder="Keterangan tambahan..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Right: Barang */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-visible">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-500" /> Cari Sparepart
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama sparepart atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
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
                            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">+ Tambah</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">Sparepart tidak ditemukan.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">Daftar Barang Dipesan</h3>
              <span className="text-sm font-bold text-violet-600">{items.length} Jenis</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Sparepart</th>
                    <th className="px-4 py-3 w-28">Qty</th>
                    <th className="px-4 py-3 w-40">Harga Estimasi</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Belum ada barang yang ditambahkan.
                      </td>
                    </tr>
                  ) : items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.name}
                        {item.sku && <p className="text-xs text-slate-400 font-normal">{item.sku}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="1"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 outline-none"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 outline-none"
                          value={item.estimatedPrice}
                          onChange={(e) => handleUpdateItem(index, 'estimatedPrice', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.quantity * item.estimatedPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Estimasi Total</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(estimatedTotal)}</p>
              </div>
              <Button size="lg" icon={Plus} onClick={handleSubmit} loading={isPending} disabled={items.length === 0}>
                Simpan Pesanan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
