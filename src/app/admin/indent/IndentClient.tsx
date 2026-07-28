'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { Plus, ClipboardList, AlertTriangle, Printer } from 'lucide-react'
import Link from 'next/link'

interface IndentRow {
  id: string
  supplierName: string
  orderDate: Date
  expectedDate: Date | null
  status: string
  branch: { name: string }
  user: { name: string }
  customer: { name: string; phone: string | null } | null
  items: { quantity: number; receivedQty: number; sparepart: { name: string } }[]
}

interface IndentClientProps {
  initialData: IndentRow[]
}

const statusVariant: Record<string, 'warning' | 'success' | 'primary' | 'danger'> = {
  PENDING: 'warning',
  PARTIAL: 'primary',
  RECEIVED: 'success',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Menunggu',
  PARTIAL: 'Sebagian Diterima',
  RECEIVED: 'Diterima',
}

export default function IndentClient({ initialData }: IndentClientProps) {
  const [statusFilter, setStatusFilter] = useState('')
  const pathname = usePathname()
  const base = pathname.startsWith('/kasir') ? '/kasir' : '/admin'
  const today = new Date()

  const filtered = initialData.filter((r) =>
    statusFilter ? r.status === statusFilter : true
  )

  const isLate = (row: IndentRow) =>
    row.status === 'PENDING' &&
    row.expectedDate &&
    new Date(row.expectedDate) < today

  const columns = [
    {
      key: 'order',
      header: 'Pesanan',
      render: (row: IndentRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.customer ? row.customer.name : row.supplierName}</p>
            <p className="text-xs text-slate-400">
              {row.customer ? `Supplier: ${row.supplierName} • ` : ''}
              Cabang {row.branch.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Tanggal Pesan / Estimasi',
      render: (row: IndentRow) => (
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
      render: (row: IndentRow) => (
        <div className="space-y-0.5">
          {row.items.slice(0, 2).map((item, i) => (
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
      render: (row: IndentRow) => (
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
      render: (row: IndentRow) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/cetak-indent/${row.id}`} target="_blank">
            <button title="Cetak Struk" className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </Link>
          {row.status !== 'RECEIVED' ? (
            <Link href={`${base}/indent/${row.id}/terima`}>
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

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-48">
          <Select
            options={[
              { label: 'Semua Status', value: '' },
              { label: 'Menunggu', value: 'PENDING' },
              { label: 'Sebagian Diterima', value: 'PARTIAL' },
              { label: 'Diterima', value: 'RECEIVED' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Link href={`${base}/indent/baru`}>
          <Button icon={Plus}>Buat Pesanan Indent</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada pesanan indent."
        />
      </div>
    </>
  )
}
