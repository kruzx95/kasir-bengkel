'use client'

import { useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Package, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  ArrowRightLeft, 
  Search, 
  RotateCw,
  Layers,
  Filter
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import TransferStockModal from '@/components/admin/TransferStockModal'

interface TransferItem {
  id: string
  type: 'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'
  quantity: number
  notes: string | null
  transferDate: Date
  sparepart: {
    name: string
    unit: string
    sku?: string | null
    sparepartBrand?: string | null
  }
  user: {
    name: string
  }
  branch: {
    name: string
  }
}

interface Branch {
  id: string
  name: string
}

interface StockTransferClientProps {
  initialTransfers: TransferItem[]
  branches?: Branch[]
}

export default function StockTransferClient({ initialTransfers, branches = [] }: StockTransferClientProps) {
  const router = useRouter()
  const [transfers] = useState(initialTransfers)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'>('ALL')
  
  const pathname = usePathname()
  const base = pathname.startsWith('/kasir') ? '/kasir' : '/admin'

  // Total metrics
  const totalUnitsTransferred = useMemo(() => {
    return transfers.reduce((sum, t) => sum + (t.quantity || 0), 0)
  }, [transfers])

  const warehouseToStoreTransfers = useMemo(
    () => transfers.filter((t) => t.type === 'WAREHOUSE_TO_STORE'),
    [transfers]
  )

  const storeToWarehouseTransfers = useMemo(
    () => transfers.filter((t) => t.type === 'STORE_TO_WAREHOUSE'),
    [transfers]
  )

  // Filtered transfers for table
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Type match
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false

      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const nameMatch = t.sparepart?.name?.toLowerCase().includes(term)
        const skuMatch = t.sparepart?.sku?.toLowerCase().includes(term)
        const userMatch = t.user?.name?.toLowerCase().includes(term)
        const notesMatch = t.notes?.toLowerCase().includes(term)
        return nameMatch || skuMatch || userMatch || notesMatch
      }

      return true
    })
  }, [transfers, typeFilter, searchTerm])

  const columns = [
    {
      key: 'time',
      header: 'Waktu & Cabang',
      render: (row: TransferItem) => (
        <div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800">
            {new Date(row.transferDate).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {new Date(row.transferDate).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })} WIB • {row.branch?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'sparepart',
      header: 'Barang / Sparepart',
      render: (row: TransferItem) => (
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-900">{row.sparepart.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            {row.sparepart.sku && <span>SKU: {row.sparepart.sku}</span>}
            {row.sparepart.sparepartBrand && <span>• Merk: {row.sparepart.sparepartBrand}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Arah Mutasi',
      render: (row: TransferItem) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            row.type === 'WAREHOUSE_TO_STORE'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {row.type === 'WAREHOUSE_TO_STORE' ? (
            <>
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Gudang ➔ Toko
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-3.5 h-3.5" />
              Toko ➔ Gudang
            </>
          )}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Jumlah',
      render: (row: TransferItem) => (
        <div className="text-right sm:text-left">
          <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
            {row.quantity}
          </span>
          <span className="text-xs text-slate-500 ml-1">{row.sparepart.unit}</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Diproses Oleh',
      render: (row: TransferItem) => (
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-700">{row.user.name}</p>
          {row.notes && (
            <p className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-[200px]" title={row.notes}>
              &ldquo;{row.notes}&rdquo;
            </p>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`${base}`}>
            <Button variant="ghost" icon={ArrowLeft} className="w-10 h-10 p-0" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-blue-600" />
              Transfer Stok Gudang ⇄ Toko
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola dan pantau pemindahan stok antar gudang dan etalase toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={RotateCw}
            onClick={() => router.refresh()}
            className="text-xs"
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            icon={ArrowRightLeft}
            onClick={() => setTransferModalOpen(true)}
            className="text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            + Transfer Multi-Barang
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Riwayat Mutasi</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {transfers.length} <span className="text-xs font-semibold text-slate-400 font-sans">({totalUnitsTransferred} unit)</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-blue-100 bg-blue-50/20 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowUpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Gudang ➔ Toko (Display)</p>
              <p className="text-xl sm:text-2xl font-black text-blue-900 mt-0.5">
                {warehouseToStoreTransfers.length} <span className="text-xs font-semibold text-blue-600/70 font-sans">transaksi</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-purple-100 bg-purple-50/20 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Toko ➔ Gudang (Retur)</p>
              <p className="text-xl sm:text-2xl font-black text-purple-900 mt-0.5">
                {storeToWarehouseTransfers.length} <span className="text-xs font-semibold text-purple-600/70 font-sans">transaksi</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari sparepart, SKU, atau staf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({transfers.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('WAREHOUSE_TO_STORE')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              typeFilter === 'WAREHOUSE_TO_STORE'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gudang ➔ Toko ({warehouseToStoreTransfers.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('STORE_TO_WAREHOUSE')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              typeFilter === 'STORE_TO_WAREHOUSE'
                ? 'bg-white text-purple-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toko ➔ Gudang ({storeToWarehouseTransfers.length})
          </button>
        </div>
      </div>

      {/* Transfer History Table */}
      <Card className="border border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <Table
          columns={columns}
          data={filteredTransfers}
          keyExtractor={(row) => row.id}
          emptyMessage="Tidak ada riwayat perpindahan stok yang sesuai dengan filter."
        />
      </Card>

      {/* Multi-Item Transfer Modal */}
      <TransferStockModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={() => {
          setTransferModalOpen(false)
          router.refresh()
        }}
        branches={branches}
      />
    </div>
  )
}