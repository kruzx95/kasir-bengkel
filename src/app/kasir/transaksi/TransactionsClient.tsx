'use client'

import { useState } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Receipt, Eye, Search, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TransactionRow {
  id: string
  invoiceNumber: string
  type: string
  total: number
  paymentMethod: string
  createdAt: Date
  customer: { name: string; plateNumber: string | null } | null
  items: { itemType: string; subtotal: number }[]
}

interface TransactionsClientProps {
  initialTransactions: TransactionRow[]
}

export default function TransactionsClient({ initialTransactions }: TransactionsClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = initialTransactions.filter((tx) => {
    const query = searchQuery.toLowerCase()
    return (
      tx.invoiceNumber.toLowerCase().includes(query) ||
      (tx.customer?.name && tx.customer.name.toLowerCase().includes(query)) ||
      (tx.customer?.plateNumber && tx.customer.plateNumber.toLowerCase().includes(query))
    )
  })

  // Calculate true revenue from item subtotals
  const serviceRevenue = filteredData.reduce((acc, tx) => {
    return acc + tx.items.filter(i => i.itemType === 'SERVICE').reduce((sum, i) => sum + i.subtotal, 0)
  }, 0)

  const sparepartRevenue = filteredData.reduce((acc, tx) => {
    return acc + tx.items.filter(i => i.itemType === 'SPAREPART').reduce((sum, i) => sum + i.subtotal, 0)
  }, 0)

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SERVICE': return <Badge variant="primary" size="sm">Servis</Badge>
      case 'SPAREPART': return <Badge variant="warning" size="sm">Sparepart</Badge>
      case 'MIXED': return <Badge variant="success" size="sm">Servis & Part</Badge>
      default: return <Badge variant="default" size="sm">{type}</Badge>
    }
  }

  const columns = [
    {
      key: 'invoice',
      header: 'No. Invoice',
      render: (row: TransactionRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 font-mono">{row.invoiceNumber}</p>
            <p className="text-xs text-slate-400">
              {new Date(row.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      render: (row: TransactionRow) => (
        row.customer ? (
          <div>
            <p className="text-sm font-medium text-slate-900">{row.customer.name}</p>
            {row.customer.plateNumber && (
              <p className="text-xs text-slate-500 font-mono">{row.customer.plateNumber}</p>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400">Pelanggan Umum</span>
        )
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      render: (row: TransactionRow) => getTypeBadge(row.type),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: TransactionRow) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Pembayaran',
      render: (row: TransactionRow) => (
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-16',
      render: (row: TransactionRow) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Eye}
          onClick={() => router.push(`/kasir/transaksi/${row.id}`)}
        />
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari invoice atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            Hari Ini
          </div>
        </div>
        
        <Link href="/kasir/transaksi/baru">
          <Button icon={Plus}>Transaksi Baru</Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Transaksi</p>
          <p className="text-xl font-bold text-slate-900">{filteredData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <p className="text-xs text-slate-500 font-medium mb-1">Pendapatan Servis</p>
          <p className="text-xl font-bold text-primary-600">
            {formatCurrency(serviceRevenue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <p className="text-xs text-slate-500 font-medium mb-1">Pendapatan Sparepart</p>
          <p className="text-xl font-bold text-warning-600">
            {formatCurrency(sparepartRevenue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada transaksi hari ini."
        />
      </div>
    </>
  )
}
