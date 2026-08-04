'use client'

import { useTransition, useEffect, useState, useRef, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertTriangle, Store } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

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

interface StockTokoClientProps {
  initialSpareparts: Sparepart[]
  totalCount?: number
}

export default function StockTokoClient({ initialSpareparts, totalCount }: StockTokoClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const initialSearch = searchParams.get('search') || ''
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<'name' | 'stock'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString())
        if (searchTerm) {
          params.set('search', searchTerm)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, pathname, router])

  const displayedSpareparts = useMemo(() => {
    return [...initialSpareparts].sort((a, b) => {
      let compareValue = 0
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name)
      } else if (sortBy === 'stock') {
        compareValue = a.stock - b.stock
      }
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }, [initialSpareparts, sortBy, sortOrder])
  
  const handleSort = (field: 'name' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const totalStoreUnits = initialSpareparts.reduce((sum, sp) => sum + sp.stock, 0)
    const totalWarehouseUnits = initialSpareparts.reduce((sum, sp) => sum + sp.warehouseStock, 0)
    const lowStoreStock = initialSpareparts.filter(
      (sp) => sp.stock < sp.minStock
    ).length

    return {
      totalItems: totalCount ?? initialSpareparts.length,
      totalStoreUnits,
      totalWarehouseUnits,
      lowStoreStock,
    }
  }, [initialSpareparts, totalCount])

  const columns = [
    {
      key: 'name',
      header: (
        <button
          onClick={() => handleSort('name')}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Nama Sparepart</span>
          {sortBy === 'name' && (
            <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
      ),
      render: (row: Sparepart) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.name}</p>
          {row.sku && <p className="text-xs text-slate-500">SKU: {row.sku}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Kategori',
      render: (row: Sparepart) => (
        <div className="text-sm text-slate-600">
          {row.sparepartType && <p>{row.sparepartType}</p>}
          {row.sparepartBrand && <p className="text-xs text-slate-500">{row.sparepartBrand}</p>}
          {row.etalase && (
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded border border-slate-200">
              {row.etalase}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: (
        <button
          onClick={() => handleSort('stock')}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Stock Toko</span>
          {sortBy === 'stock' && (
            <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
      ),
      render: (row: Sparepart) => {
        const isLow = row.stock < row.minStock
        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${
                isLow ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {row.stock} {row.unit}
            </span>
            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        )
      },
    },
    {
      key: 'warehouseStock',
      header: 'Stock Gudang',
      render: (row: Sparepart) => {
        const isLow = row.warehouseStock < row.minWarehouseStock
        return (
          <span
            className={`text-sm font-semibold ${
              isLow ? 'text-orange-600' : 'text-slate-700'
            }`}
          >
            {row.warehouseStock} {row.unit}
          </span>
        )
      },
    },
    {
      key: 'minStock',
      header: 'Min. Stock',
      render: (row: Sparepart) => (
        <div className="text-xs text-slate-500">
          <p>Toko: {row.minStock}</p>
          <p>Gudang: {row.minWarehouseStock}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      render: (row: Sparepart) => (
        <div className="text-xs">
          <p className="text-slate-600">
            Beli: Rp {row.buyPrice.toLocaleString('id-ID')}
          </p>
          <p className="text-slate-900 font-medium">
            Jual: Rp {row.sellPrice.toLocaleString('id-ID')}
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: Sparepart) => (
        <Badge variant="info">{row.branch.name}</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Stock Toko</h1>
            <p className="text-sm text-slate-500">
              Monitor stock sparepart yang siap dijual di toko
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Stock Toko
              </p>
              <p className="text-xl font-bold text-green-600">
                {stats.totalStoreUnits}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
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
                {stats.lowStoreStock}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Cari sparepart (nama, SKU, brand, tipe)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isPending && <span className="text-blue-600 animate-pulse text-xs shrink-0">Memuat...</span>}
      </Card>

      {/* Table */}
      <Card className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={displayedSpareparts}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada data stock toko."
        />
      </Card>

      {/* Info Note */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">
              Informasi Stock Toko
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                • <strong>Stock Toko:</strong> Stock yang siap dijual di toko (berkurang saat transaksi)
              </li>
              <li>
                • <strong>Stock Gudang:</strong> Stock yang ada di gudang (dari barang masuk)
              </li>
              <li>
                • <strong>Sumber Stock Toko:</strong> Input manual, import Excel, atau transfer dari gudang
              </li>
              <li>
                • <strong>Transfer:</strong> Admin bisa transfer dari gudang ke toko jika stock toko menipis
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}