'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

interface TransferItem {
  id: string
  type: 'WAREHOUSE_TO_STORE' | 'STORE_TO_WAREHOUSE'
  quantity: number
  notes: string | null
  transferDate: Date
  sparepart: {
    name: string
    unit: string
  }
  user: {
    name: string
  }
  branch: {
    name: string
  }
}

interface StockTransferClientProps {
  initialTransfers: TransferItem[]
}

export default function StockTransferClient({ initialTransfers }: StockTransferClientProps) {
  const [transfers] = useState(initialTransfers)

  // Group by type
  const warehouseToStoreCount = useMemo(
    () => transfers.filter((t) => t.type === 'WAREHOUSE_TO_STORE').length,
    [transfers]
  )

  const storeToWarehouseCount = useMemo(
    () => transfers.filter((t) => t.type === 'STORE_TO_WAREHOUSE').length,
    [transfers]
  )

  const columns = [
    {
      header: 'Waktu',
      render: (row: TransferItem) => (
        <p className="text-sm text-slate-700">
          {new Date(row.transferDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ),
    },
    {
      header: 'Sparepart',
      render: (row: TransferItem) => (
        <p className="text-sm font-medium text-slate-900">{row.sparepart.name}</p>
      ),
    },
    {
      header: 'Tipe',
      render: (row: TransferItem) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            row.type === 'WAREHOUSE_TO_STORE'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {row.type === 'WAREHOUSE_TO_STORE' ? (
            <>
              <ArrowUpCircle className="w-3 h-3" />
              Gudang → Toko
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-3 h-3" />
              Toko → Gudang
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Jumlah',
      render: (row: TransferItem) => (
        <p className="text-sm font-semibold text-slate-900">
          {row.quantity} {row.sparepart.unit}
        </p>
      ),
    },
    {
      header: 'Oleh',
      render: (row: TransferItem) => (
        <p className="text-sm text-slate-600">{row.user.name}</p>
      ),
    },
    {
      header: 'Catatan',
      render: (row: TransferItem) => (
        <p className="text-sm text-slate-500 max-w-[200px] truncate">{row.notes || '-'}</p>
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
            <h1 className="text-xl font-bold text-slate-900">Transfer Stok Gudang</h1>
            <p className="text-sm text-slate-500">Riwayat transfer stock antar gudang dan toko</p>
          </div>
        </div>
        <Link href="/admin/stock-transfer/baru">
          <Button icon={Package}>Transfer Baru</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Transfer</p>
              <p className="text-xl font-bold text-slate-900">{transfers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Gudang → Toko</p>
              <p className="text-xl font-bold text-blue-600">{warehouseToStoreCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Toko → Gudang</p>
              <p className="text-xl font-bold text-purple-600">{storeToWarehouseCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transfer History */}
      <Card>
        <Table
          columns={columns}
          data={transfers}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada riwayat transfer stock."
        />
      </Card>
    </div>
  )
}