'use client'

import { useState, useTransition } from 'react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Package, Search, AlertTriangle } from 'lucide-react'

interface SparepartRow {
  id: string
  name: string
  sku: string | null
  sellPrice: number
  stock: number
  unit: string
}

interface StockClientProps {
  initialSpareparts: SparepartRow[]
}

export default function StockClient({ initialSpareparts }: StockClientProps) {
  const [spareparts, setSpareparts] = useState(initialSpareparts)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'empty'>('all')

  const filteredData = spareparts.filter((sp) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sp.sku && sp.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    // Stock filter
    const matchesFilter =
      filter === 'all' ||
      (filter === 'low' && sp.stock > 0 && sp.stock <= 5) ||
      (filter === 'empty' && sp.stock === 0)

    return matchesSearch && matchesFilter
  })

  const lowStockCount = spareparts.filter((sp) => sp.stock > 0 && sp.stock <= 5).length
  const emptyStockCount = spareparts.filter((sp) => sp.stock === 0).length

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger" size="md">Habis</Badge>
    if (stock <= 5) return <Badge variant="warning" size="md">{stock}</Badge>
    return <Badge variant="success" size="md">{stock}</Badge>
  }

  const columns = [
    {
      key: 'name',
      header: 'Sparepart',
      render: (row: SparepartRow) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            row.stock === 0 ? 'bg-red-50' : row.stock <= 5 ? 'bg-amber-50' : 'bg-emerald-50'
          }`}>
            <Package className={`w-4 h-4 ${
              row.stock === 0 ? 'text-red-500' : row.stock <= 5 ? 'text-amber-500' : 'text-emerald-500'
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            {row.sku && (
              <p className="text-xs text-slate-400 font-mono">{row.sku}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sellPrice',
      header: 'Harga Jual',
      render: (row: SparepartRow) => (
        <span className="text-sm font-medium text-slate-900">
          {formatCurrency(row.sellPrice)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      render: (row: SparepartRow) => (
        <div className="flex items-center gap-1.5">
          {getStockBadge(row.stock)}
          <span className="text-xs text-slate-400">{row.unit}</span>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Low stock warning */}
      {(lowStockCount > 0 || emptyStockCount > 0) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {emptyStockCount > 0 && (
              <span className="font-semibold text-red-600">{emptyStockCount} item habis</span>
            )}
            {emptyStockCount > 0 && lowStockCount > 0 && ' · '}
            {lowStockCount > 0 && (
              <span className="font-semibold text-amber-700">{lowStockCount} item stok menipis</span>
            )}
            {' — '}Segera hubungi admin untuk restock.
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0 self-start sm:self-auto">
          {[
            { key: 'all' as const, label: 'Semua' },
            { key: 'low' as const, label: 'Menipis' },
            { key: 'empty' as const, label: 'Habis' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                filter === f.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-slate-500 mb-3">
        {filteredData.length} sparepart ditampilkan
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada sparepart yang cocok."
        />
      </div>
    </>
  )
}
