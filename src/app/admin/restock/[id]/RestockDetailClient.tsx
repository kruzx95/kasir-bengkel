'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  PackagePlus,
  Building2,
  User,
  CalendarDays,
  FileText,
  Receipt,
  ZoomIn,
  X,
  ImageOff,
} from 'lucide-react'

interface RestockItem {
  id: string
  quantity: number
  buyPrice: number
  subtotal: number
  sparepart: { name: string; sku: string | null }
}

interface RestockDetailProps {
  restock: {
    id: string
    supplierName: string
    date: Date
    notes: string | null
    total: number
    receiptImagePath: string | null
    indentOrderId: string | null
    branch: { name: string; address: string }
    user: { name: string }
    items: RestockItem[]
  }
}

export default function RestockDetailClient({ restock }: RestockDetailProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Convert stored path /uploads/receipts/filename to the authenticated API endpoint
  const imageUrl = restock.receiptImagePath
    ? `/api/uploads/receipts/${restock.receiptImagePath.split('/').pop()}`
    : null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href="/admin/restock">
          <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{restock.supplierName}</h1>
          <p className="text-sm text-slate-500">
            {new Date(restock.date).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Foto Nota */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Informasi PO
            </h2>

            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Cabang Penerima</p>
                <p className="text-sm font-medium text-slate-900">{restock.branch.name}</p>
                <p className="text-xs text-slate-400">{restock.branch.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Dicatat oleh</p>
                <p className="text-sm font-medium text-slate-900">{restock.user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Tanggal Masuk</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(restock.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {restock.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Catatan</p>
                  <p className="text-sm text-slate-700">{restock.notes}</p>
                </div>
              </div>
            )}

            {restock.indentOrderId && (
              <div className="flex items-start gap-3">
                <Receipt className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Sumber</p>
                  <p className="text-sm font-medium text-violet-700">Dari Pesanan Indent</p>
                </div>
              </div>
            )}
          </div>

          {/* Foto Nota */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Foto Nota Pembelian
            </h2>

            {imageUrl ? (
              <div className="space-y-2">
                <div
                  className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in group"
                  onClick={() => setLightboxOpen(true)}
                >
                  <Image
                    src={imageUrl}
                    alt="Foto nota pembelian"
                    width={400}
                    height={300}
                    className="w-full object-contain max-h-56"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">Klik untuk memperbesar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <ImageOff className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Tidak ada foto nota</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Items Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-amber-500" />
                Rincian Barang Masuk
              </h2>
              <span className="text-sm text-slate-500">{restock.items.length} jenis barang</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Sparepart</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Harga Beli</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restock.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{item.sparepart.name}</p>
                        {item.sparepart.sku && (
                          <p className="text-xs text-slate-400 font-mono">{item.sparepart.sku}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center text-slate-700">{item.quantity} pcs</td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {formatCurrency(item.buyPrice)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Pembelian</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(restock.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-3xl max-h-[90vh] overflow-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt="Foto nota pembelian"
              width={900}
              height={1200}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}
