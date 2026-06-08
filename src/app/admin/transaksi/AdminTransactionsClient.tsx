'use client'

import { useState, useTransition } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { Receipt, Eye, Filter, Calendar, Plus } from 'lucide-react'
import { getPaginatedTransactions } from '@/actions/transaction'
import Link from 'next/link'

interface AdminTransactionRow {
  id: string
  invoiceNumber: string
  type: string
  status: string
  total: number
  paymentMethod: string
  createdAt: Date | string
  customer?: { name: string; plateNumber: string | null } | null
  user: { name: string }
  mechanic?: { name: string } | null
  branch: { name: string }
}

interface AdminTransactionsClientProps {
  initialData: AdminTransactionRow[]
  initialDate: string
  branches: { id: string; name: string }[]
  initialPagination: { totalPages: number; totalCount: number; currentPage: number }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'SERVICE': return <Badge variant="primary" size="sm">Servis</Badge>
    case 'SPAREPART': return <Badge variant="warning" size="sm">Sparepart</Badge>
    case 'MIXED': return <Badge variant="success" size="sm">Servis & Part</Badge>
    default: return <Badge variant="default" size="sm">{type}</Badge>
  }
}

export default function AdminTransactionsClient({ initialData, initialDate, branches, initialPagination }: AdminTransactionsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<AdminTransactionRow[]>(initialData)
  const [pagination, setPagination] = useState(initialPagination)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedBranch, setSelectedBranch] = useState('')

  const fetchData = (page: number, branch?: string, date?: string) => {
    startTransition(async () => {
      const result = await getPaginatedTransactions(page, 50, branch || undefined, date)
      setData(result.data as AdminTransactionRow[])
      setPagination({
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount
      })
    })
  }

  const handleFilter = () => {
    fetchData(1, selectedBranch, selectedDate)
  }

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, selectedBranch, selectedDate)
  }

  const totalRevenue = data
    .filter(tx => tx.status !== 'CANCELLED')
    .reduce((acc, tx) => acc + tx.total, 0)

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-end gap-3">
        <div>
          <Input
            id="filter-date"
            name="filter-date"
            label="Tanggal"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        {branches.length > 0 && (
          <div className="w-full sm:w-56">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cabang</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            >
              <option value="">Semua Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <Button onClick={handleFilter} loading={isPending} icon={Filter}>
          Filter
        </Button>
        <div className="flex-1 hidden sm:block"></div>
        <Link href="/admin/transaksi/baru" className="w-full sm:w-auto">
          <Button icon={Plus} className="w-full sm:w-auto">Transaksi Baru</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.length} Transaksi</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-sm font-medium text-slate-500 mb-1">Transaksi Dibatalkan</p>
          <p className="text-2xl font-bold text-red-500">
            {data.filter(tx => tx.status === 'CANCELLED').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice & Waktu</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabang & Kasir</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelanggan</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bayar</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Belum ada transaksi pada tanggal ini.</p>
                  </td>
                </tr>
              ) : (
                data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 font-mono">{tx.invoiceNumber}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">{tx.branch.name}</p>
                      <p className="text-xs text-slate-500">{tx.user.name}</p>
                    </td>
                    <td className="p-4">
                      {tx.customer ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tx.customer.name}</p>
                          {tx.customer.plateNumber && (
                            <p className="text-xs text-slate-500 font-mono">{tx.customer.plateNumber}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Pelanggan Umum</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getTypeBadge(tx.type)}
                        {tx.status === 'CANCELLED' && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">Dibatalkan</span>
                        )}
                        {tx.status === 'PENDING_CORPORATE' && (
                          <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded uppercase">Korporat</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${tx.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {formatCurrency(tx.total)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/transaksi/${tx.id}`}>
                        <Button size="sm" variant="ghost" icon={Eye} aria-label="Lihat detail invoice" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Menampilkan halaman <span className="font-semibold text-slate-900">{pagination.currentPage}</span> dari <span className="font-semibold text-slate-900">{pagination.totalPages}</span> (Total: {pagination.totalCount} transaksi)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || isPending}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || isPending}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
