'use client'

import { useTransition, useEffect, useState, useRef, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertTriangle, Warehouse, Upload, Search, SlidersHorizontal, ArrowUp, ArrowDown, ArrowUpDown, ArrowRightLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import ImportWarehouseStockModal from '@/components/admin/ImportWarehouseStockModal'
import TransferStockModal from '@/components/admin/TransferStockModal'

interface Branch {
  id: string
  name: string
}

interface Sparepart {
  id: string
  name: string
  sku: string | null
  warehouseStock: number
  stock: number
  minWarehouseStock: number
  minStock: number
  unit: string
  buyPrice: number
  sellPrice: number
  sparepartBrand: string | null
  sparepartType: string | null
  sparepartSize: string | null
  etalase?: string | null
  branch: {
    name: string
  }
}

interface StockGudangClientProps {
  initialSpareparts: Sparepart[]
  branches?: Branch[]
  totalCount?: number
}

export default function StockGudangClient({ initialSpareparts, branches = [], totalCount }: StockGudangClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedTransferSparepart, setSelectedTransferSparepart] = useState<Sparepart | null>(null)

  const initialSearch = searchParams.get('search') || ''
  const initialSortBy = searchParams.get('sortBy') || 'name'
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<string>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)

  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  const applyParams = (newSearch: string, newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    startTransition(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (newSearch) {
        params.set('search', newSearch)
      } else {
        params.delete('search')
      }
      params.set('sortBy', newSortBy)
      params.set('sortOrder', newSortOrder)
      params.set('page', '1')
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParamsRef.current.get('search') || '')) {
        applyParams(searchTerm, sortBy, sortOrder)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, pathname, router, sortBy, sortOrder])

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    applyParams(searchTerm, newSortBy, newSortOrder)
  }

  const handleHeaderSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    handleSortChange(field, newOrder)
  }

  const displayedSpareparts = useMemo(() => {
    return [...initialSpareparts].sort((a, b) => {
      let compareValue = 0
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name)
      } else if (sortBy === 'warehouseStock') {
        compareValue = a.warehouseStock - b.warehouseStock
      } else if (sortBy === 'stock') {
        compareValue = a.stock - b.stock
      } else if (sortBy === 'sellPrice') {
        compareValue = a.sellPrice - b.sellPrice
      } else if (sortBy === 'buyPrice') {
        compareValue = a.buyPrice - b.buyPrice
      } else if (sortBy === 'sku') {
        compareValue = (a.sku || '').localeCompare(b.sku || '')
      }
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }, [initialSpareparts, sortBy, sortOrder])

  // Statistics - count items with warehouse stock > 0
  const stats = useMemo(() => {
    const itemsInWarehouse = initialSpareparts.filter((sp) => sp.warehouseStock > 0)
    const totalWarehouseUnits = itemsInWarehouse.reduce((sum, sp) => sum + sp.warehouseStock, 0)
    const lowWarehouseStock = itemsInWarehouse.filter(
      (sp) => sp.warehouseStock < sp.minWarehouseStock
    ).length

    return {
      totalItems: totalCount ?? itemsInWarehouse.length,
      totalWarehouseUnits,
      lowWarehouseStock,
    }
  }, [initialSpareparts, totalCount])

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600 font-bold" />
    )
  }

  const columns = [
    {
      key: 'name',
      header: (
        <button
          onClick={() => handleHeaderSort('name')}
          className="group flex items-center gap-1.5 hover:text-primary-600 transition-colors font-bold"
        >
          <span>Nama Sparepart</span>
          {getSortIcon('name')}
        </button>
      ),
      render: (row: Sparepart) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
          {row.sku && <p className="text-xs text-slate-500 font-mono">SKU: {row.sku}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Kategori / Lokasi Rak',
      render: (row: Sparepart) => (
        <div className="text-sm text-slate-600">
          {row.sparepartType && <p className="font-medium text-slate-700">{row.sparepartType}</p>}
          {row.sparepartBrand && <p className="text-xs text-slate-500">{row.sparepartBrand}</p>}
          {row.etalase && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
              Rak Gudang: {row.etalase}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'warehouseStock',
      header: (
        <button
          onClick={() => handleHeaderSort('warehouseStock')}
          className="group flex items-center gap-1.5 hover:text-primary-600 transition-colors font-bold"
        >
          <span>Stock Gudang</span>
          {getSortIcon('warehouseStock')}
        </button>
      ),
      render: (row: Sparepart) => {
        const isLow = row.warehouseStock < row.minWarehouseStock
        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md ${
                isLow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-purple-50 text-purple-900 border border-purple-200/60'
              }`}
            >
              {row.warehouseStock} {row.unit}
            </span>
            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        )
      },
    },
    {
      key: 'stock',
      header: (
        <button
          onClick={() => handleHeaderSort('stock')}
          className="group flex items-center gap-1.5 hover:text-primary-600 transition-colors font-bold"
        >
          <span>Stock Toko</span>
          {getSortIcon('stock')}
        </button>
      ),
      render: (row: Sparepart) => {
        const isLow = row.stock < row.minStock
        return (
          <span
            className={`text-sm font-semibold font-mono px-2 py-0.5 rounded-md ${
              isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-700'
            }`}
          >
            {row.stock} {row.unit}
          </span>
        )
      },
    },
    {
      key: 'minStock',
      header: 'Min. Stock',
      render: (row: Sparepart) => (
        <div className="text-xs text-slate-500 font-mono space-y-0.5">
          <p>Gudang: <strong className="text-slate-700">{row.minWarehouseStock}</strong></p>
          <p>Toko: <strong className="text-slate-700">{row.minStock}</strong></p>
        </div>
      ),
    },
    {
      key: 'price',
      header: (
        <button
          onClick={() => handleHeaderSort('sellPrice')}
          className="group flex items-center gap-1.5 hover:text-primary-600 transition-colors font-bold"
        >
          <span>Harga</span>
          {getSortIcon('sellPrice')}
        </button>
      ),
      render: (row: Sparepart) => (
        <div className="text-xs font-mono">
          <p className="text-slate-500">
            Beli: Rp {row.buyPrice.toLocaleString('id-ID')}
          </p>
          <p className="text-slate-900 font-bold text-[13px]">
            Jual: Rp {row.sellPrice.toLocaleString('id-ID')}
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: Sparepart) => (
        <Badge variant="info" size="sm">{row.branch.name}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Sparepart) => (
        <Button
          size="sm"
          variant="outline"
          icon={ArrowRightLeft}
          onClick={() => {
            setSelectedTransferSparepart(row)
            setTransferModalOpen(true)
          }}
          className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50 py-1 px-2.5 h-auto"
        >
          Transfer
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Stock Gudang</h1>
            <p className="text-sm text-slate-500">
              Kelola stock sparepart di gudang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setImportModalOpen(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Import Excel
          </Button>

          <Button
            variant="primary"
            icon={ArrowRightLeft}
            onClick={() => {
              setSelectedTransferSparepart(null)
              setTransferModalOpen(true)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Transfer ke Toko
          </Button>
        </div>
      </div>

      {/* Modal Import Stok Gudang */}
      <ImportWarehouseStockModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        branches={branches}
      />

      {/* Modal Transfer Stok */}
      <TransferStockModal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false)
          setSelectedTransferSparepart(null)
        }}
        initialSparepart={selectedTransferSparepart}
        initialType="WAREHOUSE_TO_STORE"
        branches={branches}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Total Item
              </p>
              <p className="text-xl font-bold text-slate-900">{stats.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Stock Gudang
              </p>
              <p className="text-xl font-bold text-purple-600">
                {stats.totalWarehouseUnits}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Stock Rendah
              </p>
              <p className="text-xl font-bold text-red-600">
                {stats.lowWarehouseStock}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Stock {'<'} minimum
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Sort Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari sparepart (nama, SKU, brand, tipe, lokasi rak)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Urutkan:</span>
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                handleSortChange(field, order as 'asc' | 'desc')
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs cursor-pointer"
            >
              <option value="warehouseStock-desc">Stok Gudang: Terbanyak</option>
              <option value="warehouseStock-asc">Stok Gudang: Tersedikit (Menipis)</option>
              <option value="name-asc">Nama (A → Z)</option>
              <option value="name-desc">Nama (Z → A)</option>
              <option value="stock-desc">Stok Toko: Terbanyak</option>
              <option value="stock-asc">Stok Toko: Tersedikit</option>
              <option value="sellPrice-desc">Harga Jual: Tertinggi</option>
              <option value="sellPrice-asc">Harga Jual: Terendah</option>
              <option value="buyPrice-desc">Harga Modal: Tertinggi</option>
              <option value="buyPrice-asc">Harga Modal: Terendah</option>
              <option value="createdAt-desc">Terbaru Ditambahkan</option>
            </select>
          </div>
          {isPending && <span className="text-purple-600 animate-pulse text-xs shrink-0">Memuat...</span>}
        </div>
      </Card>

      {/* Table */}
      <Card className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={displayedSpareparts}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada data stock gudang."
        />
      </Card>

      {/* Info Note */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">
              Informasi Stock Gudang
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                • <strong>Menu ini HANYA menampilkan sparepart yang stock gudangnya {'>'} 0</strong>
              </li>
              <li>
                • <strong>Barang Masuk:</strong> Saat terima PO/restock, otomatis masuk ke stock gudang
              </li>
              <li>
                • <strong>Stock Rendah:</strong> Menghitung item yang stock gudangnya {'<'} minimum gudang (minWarehouseStock)
              </li>
              <li>
                • <strong>Stock Toko:</strong> Stock yang siap dijual di toko (terpisah dari gudang)
              </li>
              <li>
                • <strong>Transfer:</strong> Admin bisa transfer dari gudang ke toko jika diperlukan
              </li>
              <li>
                • Jika belum ada barang masuk, semua statistik akan menampilkan 0
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}