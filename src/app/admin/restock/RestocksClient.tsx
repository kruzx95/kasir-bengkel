/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, PackagePlus, Search, ImageIcon, ChevronRight, Printer, AlertTriangle, ClipboardList } from 'lucide-react'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RestocksClient({ initialPOs, initialHistory }: { initialPOs: any[], initialHistory: any[] }) {
  const [activeTab, setActiveTab] = useState<'PO' | 'HISTORY'>('PO')
  const [searchQuery, setSearchQuery] = useState('')
  const today = new Date()

  // ---- PO TAB LOGIC ----
  const filteredPOs = initialPOs.filter((r) =>
    r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isLate = (row: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
    row.status === 'PENDING' &&
    row.expectedDate &&
    new Date(row.expectedDate) < today

  const statusVariant: Record<string, 'warning' | 'success' | 'primary'> = {
    PENDING: 'warning',
    PARTIAL: 'primary',
    RECEIVED: 'success',
  }
  
  const statusLabel: Record<string, string> = {
    PENDING: 'Menunggu',
    PARTIAL: 'Sebagian Diterima',
    RECEIVED: 'Selesai',
  }

  const poColumns = [
    {
      key: 'order',
      header: 'Pesanan PO',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.supplierName}</p>
            <p className="text-xs text-slate-400">Cabang {row.branch.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Tanggal Pesan / Estimasi',
      render: (row: any) => (
        <div>
          <p className="text-sm text-slate-700">
            {new Date(row.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {row.expectedDate && (
            <p className={`text-xs mt-0.5 ${isLate(row) ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
              {isLate(row) && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
              Est: {new Date(row.expectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Barang',
      render: (row: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
        <div className="space-y-0.5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {row.items.slice(0, 2).map((item: any, i: number) => (
            <p key={i} className="text-xs text-slate-600">
              {item.sparepart.name}
              <span className="text-slate-400 ml-1">
                ({item.receivedQty}/{item.quantity})
              </span>
            </p>
          ))}
          {row.items.length > 2 && (
            <p className="text-xs text-slate-400">+{row.items.length - 2} lainnya</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[row.status] || 'primary'} size="md">
            {statusLabel[row.status] || row.status}
          </Badge>
          {isLate(row) && (
            <Badge variant="danger" size="sm">Terlambat</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-44',
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/cetak-indent/${row.id}`} target="_blank">
            <button title="Cetak PO" className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </Link>
          {row.status !== 'RECEIVED' ? (
            <Link href={`/admin/restock/${row.id}/terima`}>
              <Button size="sm" variant="outline">
                Terima Barang
              </Button>
            </Link>
          ) : (
            <span className="text-xs text-slate-400 ml-1">Selesai</span>
          )}
        </div>
      ),
    },
  ]

  // ---- HISTORY TAB LOGIC ----
  const filteredHistory = initialHistory.filter((r) =>
    r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const historyColumns = [
    {
      key: 'date',
      header: 'Tanggal Diterima',
      render: (row: any) => (
        <span className="text-sm font-medium text-slate-700">
          {new Date(row.date).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{row.supplierName}</p>
            {row.receiptImagePath && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <ImageIcon className="w-3 h-3" /> Ada foto nota
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang Penerima',
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">Penerima: {row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Total Barang',
      render: (row: any) => (
        <span className="text-sm text-slate-700">{row.items.length} item</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Pembelian',
      render: (row: any) => (
        <div>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
          <div className="mt-1">
            {row.paymentStatus === 'LUNAS' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 tracking-wider">LUNAS</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 tracking-wider">HUTANG</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (row: any) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/cetak-po/${row.id}`} target="_blank">
            <button title="Cetak PO" className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </Link>
          <Link href={`/admin/restock/${row.id}`}>
            <button title="Lihat Detail" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('PO')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'PO' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar PO Restock
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'HISTORY' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Riwayat Penerimaan
          </button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari supplier atau cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <Link href="/admin/restock/baru">
            <Button icon={Plus}>Buat PO Restock</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {activeTab === 'PO' ? (
          <Table
            columns={poColumns}
            data={filteredPOs}
            keyExtractor={(row) => row.id}
            emptyMessage="Belum ada pesanan PO barang masuk yang sedang berjalan."
          />
        ) : (
          <Table
            columns={historyColumns}
            data={filteredHistory}
            keyExtractor={(row) => row.id}
            emptyMessage="Belum ada riwayat penerimaan barang masuk."
          />
        )}
      </div>
    </>
  )
}
