'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { receiveIndentOrder, type ReceiveIndentPayload } from '@/actions/indent'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface IndentItem {
  id: string
  quantity: number
  receivedQty: number
  estimatedPrice: number
  sparepart: { id: string; name: string; sku: string | null; unit: string }
}

interface IndentOrder {
  id: string
  supplierName: string
  orderDate: Date
  expectedDate: Date | null
  branch: { id: string; name: string }
  items: IndentItem[]
}

export default function ReceiveIndentClient({ indentOrder }: { indentOrder: IndentOrder }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [receiptImagePath, setReceiptImagePath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Track received qty & actual price per item
  const [receivedItems, setReceivedItems] = useState<
    { indentOrderItemId: string; sparepartId: string; receivedQty: number; actualPrice: number }[]
  >(
    indentOrder.items.map((item) => ({
      indentOrderItemId: item.id,
      sparepartId: item.sparepart.id,
      receivedQty: item.quantity - item.receivedQty, // default: remaining qty
      actualPrice: item.estimatedPrice,
    }))
  )

  const updateItem = (index: number, field: 'receivedQty' | 'actualPrice', value: number) => {
    const updated = [...receivedItems]
    updated[index][field] = Math.max(0, value)
    setReceivedItems(updated)
  }

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

  const handleSubmit = () => {
    const hasAnyReceived = receivedItems.some((i) => i.receivedQty > 0)
    if (!hasAnyReceived) {
      setError('Masukkan jumlah barang yang diterima minimal untuk satu item.')
      return
    }
    setError(null)

    startTransition(async () => {
      const payload: ReceiveIndentPayload = {
        indentOrderId: indentOrder.id,
        supplierName: indentOrder.supplierName,
        date,
        notes: notes || null,
        receiptImagePath: receiptImagePath || null,
        items: receivedItems,
      }
      const res = await receiveIndentOrder(payload)
      if (res.success) {
        router.push('/admin/indent')
      } else {
        setError(res.message || 'Gagal menyimpan penerimaan')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/indent">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terima Barang</h1>
          <p className="text-sm text-slate-500">
            Supplier: {indentOrder.supplierName} — {indentOrder.branch.name}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi Penerimaan</h2>

          <Input
            type="date"
            label="Tanggal Terima"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Catatan"
            placeholder="No. Surat Jalan / Keterangan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Upload Foto Nota */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Foto Nota
              <span className="text-xs text-slate-400 font-normal ml-1">(opsional)</span>
            </label>
            {receiptPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <Image src={receiptPreview} alt="Nota" width={400} height={300}
                  className="w-full object-contain max-h-40" unoptimized />
                <button type="button" onClick={() => { setReceiptImagePath(null); setReceiptPreview(null) }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                {uploadingReceipt ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                    <span className="text-sm">Mengupload...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Upload foto nota</span>
                  </>
                )}
                <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden"
                  onChange={handleReceiptUpload} disabled={uploadingReceipt} />
              </label>
            )}
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
          </div>
        </div>

        {/* Right: Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">Rincian Barang Diterima</h3>
              <p className="text-xs text-slate-400 mt-0.5">Isi jumlah yang benar-benar diterima. Kosongkan (0) jika belum diterima.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Sparepart</th>
                    <th className="px-4 py-3 w-24">Dipesan</th>
                    <th className="px-4 py-3 w-28">Diterima</th>
                    <th className="px-4 py-3 w-36">Harga Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indentOrder.items.map((item, index) => {
                    const remaining = item.quantity - item.receivedQty
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.sparepart.name}</p>
                          {item.sparepart.sku && (
                            <p className="text-xs text-slate-400">{item.sparepart.sku}</p>
                          )}
                          {item.receivedQty > 0 && (
                            <p className="text-xs text-emerald-600">Sudah diterima: {item.receivedQty}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {item.quantity} {item.sparepart.unit}
                          <p className="text-xs text-slate-400">Sisa: {remaining}</p>
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" max={remaining}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 outline-none"
                            value={receivedItems[index]?.receivedQty ?? 0}
                            onChange={(e) => updateItem(index, 'receivedQty', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-primary-500 outline-none"
                            value={receivedItems[index]?.actualPrice ?? 0}
                            onChange={(e) => updateItem(index, 'actualPrice', parseInt(e.target.value) || 0)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Aktual</p>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(receivedItems.reduce((acc, i) => acc + i.receivedQty * i.actualPrice, 0))}
                </p>
              </div>
              <Button size="lg" icon={Save} onClick={handleSubmit} loading={isPending}>
                Simpan Penerimaan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
