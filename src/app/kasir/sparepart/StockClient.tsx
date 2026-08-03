'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SparepartFormModal from '@/components/admin/SparepartFormModal'
import ImportSparepartModal from '@/components/admin/ImportSparepartModal'
import { formatCurrency } from '@/lib/utils'
import { Package, Search, AlertTriangle, Plus, Upload, Pencil } from 'lucide-react'

interface Branch {
  id: string
  code: string
  name: string
}

interface SparepartRow {
  id: string
  name: string
  sku: string | null
  sparepartType?: string | null
  sparepartBrand?: string | null
  sparepartSize?: string | null
  etalase?: string | null
  buyPrice?: number
  sellPrice: number
  stock: number
  unit: string
  branchId?: string
}

interface StockClientProps {
  initialSpareparts: SparepartRow[]
  branches: Branch[]
  totalCount: number
}

export default function StockClient({ initialSpareparts, branches, totalCount }: StockClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editData, setEditData] = useState<SparepartRow | null>(null)

  const initialSearch = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [filter, setFilter] = useState<'all' | 'low' | 'empty'>('all')

  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router])

  const filteredData = initialSpareparts.filter((sp) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'low' && sp.stock > 0 && sp.stock <= 5) ||
      (filter === 'empty' && sp.stock === 0)
    return matchesFilter
  })

  const lowStockCount = initialSpareparts.filter((sp) => sp.stock > 0 && sp.stock <= 5).length
  const emptyStockCount = initialSpareparts.filter((sp) => sp.stock === 0).length

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger" size="md">Habis</Badge>
    if (stock <= 5) return <Badge variant="warning" size="md">{stock}</Badge>
    return <Badge variant="success" size="md">{stock}</Badge>
  }

  const handleEdit = (sp: SparepartRow) => {
    setEditData(sp)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
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
      key: 'etalase',
      header: 'Etalase / Rak',
      render: (row: SparepartRow) => (
        row.etalase ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {row.etalase}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
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
    {
      key: 'actions',
      header: '',
      className: 'text-right w-16',
      render: (row: SparepartRow) => (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => handleEdit(row)}
          />
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
            {' — '}Segera lakukan restock jika diperlukan.
          </p>
        </div>
      )}

      {/* Search & Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, SKU, jenis, merk, etalase..."
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

        {/* Action Buttons for Kasir */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setImportModalOpen(true)}
          >
            Import Excel
          </Button>
          <Button
            icon={Plus}
            onClick={() => {
              setEditData(null)
              setModalOpen(true)
            }}
          >
            Tambah Sparepart
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-500">
          {filteredData.length} item dari total {totalCount} sparepart (halaman ini)
        </p>
        {isPending && <span className="text-primary-500 animate-pulse text-xs">Mencari...</span>}
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada sparepart yang cocok."
        />
      </div>

      {/* Form Modal */}
      <SparepartFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editData={editData as any}
      />

      {/* Import Modal */}
      <ImportSparepartModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        branches={branches}
      />
    </>
  )
}
