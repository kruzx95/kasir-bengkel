'use client'

import { useState, useTransition } from 'react'
import { getActivityLogs, GetLogsFilter } from '@/actions/log'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Receipt,
  Package,
  Shield,
  Layers,
  Calendar,
  Eye,
  RefreshCw,
  User,
  Clock,
  Building2,
} from 'lucide-react'
import { exportProfessionalExcel } from '@/lib/exportExcel'

interface Branch {
  id: string
  name: string
  code: string
}

interface LogItem {
  id: string
  branchId: string | null
  userId: string | null
  userName: string
  userRole: 'ADMIN' | 'KASIR'
  action: string
  category: string
  description: string
  details: string | null
  ipAddress: string | null
  createdAt: string
  branch: { name: string; code: string } | null
}

interface LogsClientProps {
  initialLogs: LogItem[]
  initialPagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  initialStats: {
    total: number
    totalTransactions: number
    totalStock: number
    totalMaster: number
    totalSystem: number
  }
  branches: Branch[]
  isSuperAdmin: boolean
  shopName: string
}

const CATEGORY_OPTIONS = [
  { label: 'Semua Kategori', value: 'all' },
  { label: '🛒 Transaksi', value: 'TRANSACTION' },
  { label: '📦 Stok & Restock', value: 'STOCK' },
  { label: '🔧 Master Data', value: 'MASTER' },
  { label: '👤 Pengguna', value: 'USER' },
  { label: '⚠️ Sistem & Keamanan', value: 'SYSTEM' },
]

export default function LogsClient({
  initialLogs,
  initialPagination,
  initialStats,
  branches,
  isSuperAdmin,
  shopName,
}: LogsClientProps) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs)
  const [pagination, setPagination] = useState(initialPagination)
  const [stats, setStats] = useState(initialStats)
  const [isPending, startTransition] = useTransition()

  // Filter state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [branchId, setBranchId] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  // Selected Log Modal Detail
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const fetchLogs = (newFilter: Partial<GetLogsFilter> = {}) => {
    const currentFilter: GetLogsFilter = {
      search,
      category,
      branchId,
      startDate,
      endDate,
      page,
      ...newFilter,
    }

    startTransition(async () => {
      const res = await getActivityLogs(currentFilter)
      if (res.success && res.logs) {
        setLogs(res.logs as unknown as LogItem[])
        if (res.pagination) setPagination(res.pagination)
        if (res.stats) setStats(res.stats)
      }
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs({ page: 1 })
  }

  const handleResetFilter = () => {
    setSearch('')
    setCategory('all')
    setBranchId('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
    fetchLogs({
      search: '',
      category: 'all',
      branchId: 'all',
      startDate: '',
      endDate: '',
      page: 1,
    })
  }

  const handleExportExcel = async () => {
    const formattedRows = logs.map((l) => ({
      waktu: new Date(l.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      user: l.userName,
      role: l.userRole,
      cabang: l.branch ? l.branch.name : 'Semua Cabang',
      kategori: l.category,
      aksi: l.action,
      deskripsi: l.description,
      detail: l.details || '-',
    }))

    await exportProfessionalExcel({
      shopName: shopName,
      title: 'AUDIT LOG AKTIVITAS SISTEM',
      period: startDate && endDate ? `${startDate} s.d ${endDate}` : 'Keseluruhan Log',
      filename: `log_aktivitas_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Log Aktivitas',
      columns: [
        { header: 'Waktu', key: 'waktu', width: 22 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Role', key: 'role', width: 12 },
        { header: 'Cabang', key: 'cabang', width: 22 },
        { header: 'Kategori', key: 'kategori', width: 16 },
        { header: 'Aksi', key: 'aksi', width: 22 },
        { header: 'Deskripsi', key: 'deskripsi', width: 45 },
        { header: 'Detail JSON', key: 'detail', width: 40 },
      ],
      rows: formattedRows,
    })
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'TRANSACTION':
        return <Badge variant="success">Transaksi</Badge>
      case 'STOCK':
        return <Badge variant="primary">Stok</Badge>
      case 'MASTER':
        return <Badge variant="info">Master Data</Badge>
      case 'USER':
        return <Badge variant="warning">Pengguna</Badge>
      case 'SYSTEM':
        return <Badge variant="danger">Sistem</Badge>
      default:
        return <Badge variant="default">{cat}</Badge>
    }
  }

  const columns = [
    {
      key: 'createdAt',
      header: 'Waktu',
      render: (row: LogItem) => (
        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {new Date(row.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
            <span className="text-slate-400 ml-1">
              {new Date(row.createdAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User / Pengguna',
      render: (row: LogItem) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{row.userName}</p>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.userRole}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Cabang',
      render: (row: LogItem) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.branch ? row.branch.name : 'Pusat / Semua'}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (row: LogItem) => getCategoryBadge(row.category),
    },
    {
      key: 'description',
      header: 'Aktivitas / Deskripsi',
      render: (row: LogItem) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{row.description}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{row.action}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Detail',
      render: (row: LogItem) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={() => setSelectedLog(row)}
        >
          Lihat
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Log Recorded"
          value={stats.total.toLocaleString('id-ID')}
          icon={ScrollText}
        />
        <StatCard
          title="Log Transaksi"
          value={stats.totalTransactions.toLocaleString('id-ID')}
          icon={Receipt}
        />
        <StatCard
          title="Log Stok & Barang"
          value={stats.totalStock.toLocaleString('id-ID')}
          icon={Package}
        />
        <StatCard
          title="Log Sistem & Master"
          value={(stats.totalSystem + stats.totalMaster).toLocaleString('id-ID')}
          icon={Shield}
        />
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Audit Log</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={handleResetFilter}
              loading={isPending}
            >
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleExportExcel}
              disabled={logs.length === 0}
            >
              Export Excel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-1">
            <Input
              placeholder="Cari user / deskripsi / aksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Kategori */}
          <div>
            <Select
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
                fetchLogs({ category: e.target.value, page: 1 })
              }}
            />
          </div>

          {/* Cabang (if Super Admin) */}
          {isSuperAdmin ? (
            <div>
              <Select
                options={[
                  { label: 'Semua Cabang', value: 'all' },
                  ...branches.map((b) => ({ label: b.name, value: b.id })),
                ]}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value)
                  setPage(1)
                  fetchLogs({ branchId: e.target.value, page: 1 })
                }}
              />
            </div>
          ) : (
            <div className="flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              Cabang Anda
            </div>
          )}

          {/* Tanggal Mulai */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
                fetchLogs({ startDate: e.target.value, page: 1 })
              }}
            />
          </div>

          {/* Tanggal Selesai */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
                fetchLogs({ endDate: e.target.value, page: 1 })
              }}
            />
          </div>
        </form>
      </div>

      {/* Table & Pagination */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={logs}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada catatan log aktivitas yang cocok dengan filter."
        />
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Menampilkan {logs.length} dari {pagination.total} catatan
            </p>
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalCount={pagination.total}
              onPageChange={(p) => {
                setPage(p)
                fetchLogs({ page: p })
              }}
            />
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Detail Audit Log"
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">Pengguna</p>
                <p className="text-sm font-bold text-slate-900">{selectedLog.userName}</p>
                <p className="text-xs text-slate-500">{selectedLog.userRole}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Cabang</p>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedLog.branch ? selectedLog.branch.name : 'Semua Cabang / Pusat'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Kategori & Aksi</p>
                <div className="flex items-center gap-2 mt-1">
                  {getCategoryBadge(selectedLog.category)}
                  <span className="font-mono text-xs text-slate-600 bg-white border px-1.5 py-0.5 rounded">
                    {selectedLog.action}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Waktu Transaksi</p>
                <p className="text-xs font-mono text-slate-700 mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Deskripsi Aksi</p>
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-sm font-medium text-blue-950">
                {selectedLog.description}
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Payload / Detail JSON</p>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                  {selectedLog.details}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
