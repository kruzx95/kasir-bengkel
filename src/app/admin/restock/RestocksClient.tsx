'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Plus, PackagePlus, Search } from 'lucide-react'
import Link from 'next/link'

interface RestockRow {
  id: string
  supplierName: string
  date: Date
  total: number
  branch: { name: string }
  user: { name: string }
  items: { quantity: number }[]
}

export default function RestocksClient({ initialData }: { initialData: RestockRow[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = initialData.filter((r) =>
    r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns = [
    {
      key: 'date',
      header: 'Tanggal PO',
      render: (row: RestockRow) => (
        <span className="text-sm font-medium text-slate-700">
          {new Date(row.date).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row: RestockRow) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <PackagePlus className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">{row.supplierName}</span>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang Penerima',
      render: (row: RestockRow) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.branch.name}</p>
          <p className="text-xs text-slate-500">Pencatat: {row.user.name}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Total Jenis Barang',
      render: (row: RestockRow) => (
        <span className="text-sm text-slate-700">{row.items.length} item</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Pembelian',
      render: (row: RestockRow) => (
        <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari supplier atau cabang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <Link href="/admin/restock/baru">
          <Button icon={Plus}>Catat Barang Masuk</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada riwayat pencatatan barang masuk."
        />
      </div>
    </>
  )
}
