'use client'

import { useState, useTransition } from 'react'
import { getActivityLogs, purgeOldLogs, GetLogsFilter } from '@/actions/log'
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
  Filter,
  Search,
  Calendar,
  Download,
  Receipt,
  Package,
  Shield,
  Eye,
  RefreshCw,
  User as UserIcon,
  Clock,
  Building2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Globe,
  Laptop,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { exportProfessionalExcel } from '@/lib/exportExcel'

interface Branch {
  id: string
  name: string
  code: string
}

interface UserOption {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'KASIR'
}

interface LogItem {
  id: string
  branchId: string | null
  userId: string | null
  userName: string
  userRole: 'ADMIN' | 'KASIR'
  action: string
  category: string
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  description: string
  details: string | null
  ipAddress: string | null
  userAgent: string | null
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
    totalCritical: number
    totalWarning: number
  }
  branches: Branch[]
  users: UserOption[]
  isSuperAdmin: boolean
  shopName: string
}

const CATEGORY_OPTIONS = [
  { label: 'Semua Kategori', value: 'all' },
  { label: '🛒 Transaksi', value: 'TRANSACTION' },
  { label: '📦 Stok & Barang', value: 'STOCK' },
  { label: '🔧 Master Data', value: 'MASTER' },
  { label: '👤 Pengguna', value: 'USER' },
  { label: '💳 Keuangan', value: 'FINANCE' },
  { label: '⚙️ Sistem', value: 'SYSTEM' },
]

const LEVEL_OPTIONS = [
  { label: 'Semua Tingkat', value: 'all' },
  { label: '🟢 INFO', value: 'INFO' },
  { label: '🟡 WARNING', value: 'WARNING' },
  { label: '🔴 CRITICAL', value: 'CRITICAL' },
]

function formatIpAddress(ip: string | null | undefined): string {
  if (!ip) return '-'
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (Localhost)'
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '')
  return ip
}

function formatDiffValue(val: unknown): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'boolean') return val ? 'Ya / Aktif' : 'Tidak / Nonaktif'
  if (typeof val === 'number') {
    if (val >= 1000) return `Rp ${val.toLocaleString('id-ID')}`
    return String(val)
  }
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function parseLogDetails(detailsStr: string | null) {
  if (!detailsStr) return { parsed: null, hasDiff: false, changes: [] }
  try {
    const parsed = JSON.parse(detailsStr)
    if (parsed && typeof parsed === 'object') {
      if (parsed.changes && typeof parsed.changes === 'object') {
        const changes = Object.entries(parsed.changes).map(([field, values]) => {
          const val = values as { before: unknown; after: unknown }
          return {
            field,
            before: formatDiffValue(val?.before),
            after: formatDiffValue(val?.after),
          }
        })
        return { parsed, hasDiff: changes.length > 0, changes }
      }
    }
    return { parsed, hasDiff: false, changes: [] }
  } catch {
    return { parsed: detailsStr, hasDiff: false, changes: [] }
  }
}

export default function LogsClient({
  initialLogs,
  initialPagination,
  initialStats,
  branches,
  users,
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
  const [level, setLevel] = useState('all')
  const [userId, setUserId] = useState('all')
  const [branchId, setBranchId] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  // Selected Log Modal Detail
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)
  const [viewRawJson, setViewRawJson] = useState(false)

  // Cleanup / Purge Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [purgeDays, setPurgeDays] = useState(90)
  const [purgeFeedback, setPurgeFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPurging, startPurgeTransition] = useTransition()

  const fetchLogs = (newFilter: Partial<GetLogsFilter> = {}) => {
    const currentFilter: GetLogsFilter = {
      search,
      category,
      level,
      userId,
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
        if (res.stats) setStats(res.stats as unknown as typeof initialStats)
      }
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs({ page: 1 })
  }

  const handleQuickDate = (type: 'today' | '7days' | 'month' | 'all') => {
    const now = new Date()
    let start = ''
    let end = ''

    if (type === 'today') {
      start = now.toISOString().slice(0, 10)
      end = now.toISOString().slice(0, 10)
    } else if (type === '7days') {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      start = past.toISOString().slice(0, 10)
      end = now.toISOString().slice(0, 10)
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      start = firstDay.toISOString().slice(0, 10)
      end = now.toISOString().slice(0, 10)
    }

    setStartDate(start)
    setEndDate(end)
    setPage(1)
    fetchLogs({ startDate: start, endDate: end, page: 1 })
  }

  const handleResetFilter = () => {
    setSearch('')
    setCategory('all')
    setLevel('all')
    setUserId('all')
    setBranchId('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
    fetchLogs({
      search: '',
      category: 'all',
      level: 'all',
      userId: 'all',
      branchId: 'all',
      startDate: '',
      endDate: '',
      page: 1,
    })
  }

  const handlePurgeLogs = () => {
    startPurgeTransition(async () => {
      setPurgeFeedback(null)
      const res = await purgeOldLogs(purgeDays)
      if (res.success) {
        setPurgeFeedback({ message: res.message, type: 'success' })
        fetchLogs({ page: 1 })
      } else {
        setPurgeFeedback({ message: res.message || 'Gagal membersihkan log', type: 'error' })
      }
    })
  }

  const handleExportExcel = async () => {
    const formattedRows = logs.map((l) => ({
      waktu: new Date(l.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      level: l.level || 'INFO',
      user: l.userName,
      role: l.userRole,
      cabang: l.branch ? l.branch.name : 'Semua Cabang',
      kategori: l.category,
      aksi: l.action,
      deskripsi: l.description,
      ip: formatIpAddress(l.ipAddress),
      detail: l.details || '-',
    }))

    await exportProfessionalExcel({
      shopName: shopName,
      title: 'AUDIT LOG AKTIVITAS & KEAMANAN SISTEM',
      period: startDate && endDate ? `${startDate} s.d ${endDate}` : 'Keseluruhan Log',
      filename: `audit_log_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Audit Log',
      columns: [
        { header: 'Waktu', key: 'waktu', width: 22 },
        { header: 'Level', key: 'level', width: 14 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Role', key: 'role', width: 12 },
        { header: 'Cabang', key: 'cabang', width: 22 },
        { header: 'Kategori', key: 'kategori', width: 16 },
        { header: 'Aksi', key: 'aksi', width: 22 },
        { header: 'Deskripsi', key: 'deskripsi', width: 45 },
        { header: 'IP Address', key: 'ip', width: 16 },
        { header: 'Detail JSON / Diff', key: 'detail', width: 40 },
      ],
      rows: formattedRows,
    })
  }

  const getSeverityBadge = (lvl: string) => {
    switch (lvl) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            CRITICAL
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARNING
          </span>
        )
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3 h-3 text-slate-500" />
            INFO
          </span>
        )
    }
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'TRANSACTION':
        return <Badge variant="success">Transaksi</Badge>
      case 'STOCK':
        return <Badge variant="primary">Stok & Barang</Badge>
      case 'MASTER':
        return <Badge variant="info">Master Data</Badge>
      case 'USER':
        return <Badge variant="warning">Pengguna</Badge>
      case 'FINANCE':
        return <Badge variant="default">Keuangan</Badge>
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
          <div>
            <p className="font-semibold text-slate-800">
              {new Date(row.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="text-slate-400 text-[11px]">
              {new Date(row.createdAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Tingkat',
      render: (row: LogItem) => getSeverityBadge(row.level || 'INFO'),
    },
    {
      key: 'user',
      header: 'Pengguna',
      render: (row: LogItem) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <UserIcon className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{row.userName}</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">{row.userRole}</span>
              {row.branch && (
                <span className="text-[10px] text-slate-500 font-medium">({row.branch.name})</span>
              )}
            </div>
          </div>
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
        <div className="max-w-md">
          <p className="text-xs font-medium text-slate-900 leading-relaxed">{row.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {row.action}
            </span>
            {row.ipAddress && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-blue-500" />
                {formatIpAddress(row.ipAddress)}
              </span>
            )}
          </div>
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
          onClick={() => {
            setSelectedLog(row)
            setViewRawJson(false)
          }}
        >
          Lihat
        </Button>
      ),
    },
  ]

  const logDetailInfo = selectedLog ? parseLogDetails(selectedLog.details) : null

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Log"
          value={stats.total.toLocaleString('id-ID')}
          icon={ScrollText}
        />
        <StatCard
          title="Aktivitas Kritis"
          value={stats.totalCritical.toLocaleString('id-ID')}
          icon={AlertOctagon}
        />
        <StatCard
          title="Peringatan"
          value={stats.totalWarning.toLocaleString('id-ID')}
          icon={AlertTriangle}
        />
        <StatCard
          title="Transaksi Jual"
          value={stats.totalTransactions.toLocaleString('id-ID')}
          icon={Receipt}
        />
        <StatCard
          title="Stok & Restock"
          value={stats.totalStock.toLocaleString('id-ID')}
          icon={Package}
        />
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Top bar: Title + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Audit Trail</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleExportExcel}
              disabled={logs.length === 0}
            >
              Export Excel
            </Button>

            {isSuperAdmin && (
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  setPurgeFeedback(null)
                  setShowPurgeModal(true)
                }}
              >
                Pembersihan Log
              </Button>
            )}
          </div>
        </div>

        {/* Tier 1: Search & Categorical Selects */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3">
            {/* Search bar */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
              <Input
                placeholder="Cari user / aksi / deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Severity Level Filter */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
              <Select
                options={LEVEL_OPTIONS}
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value)
                  setPage(1)
                  fetchLogs({ level: e.target.value, page: 1 })
                }}
              />
            </div>

            {/* Kategori */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
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

            {/* User/Kasir Filter */}
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
              <Select
                options={[
                  { label: 'Semua Pengguna', value: 'all' },
                  ...users.map((u) => ({ label: `${u.name} (${u.role})`, value: u.id })),
                ]}
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  setPage(1)
                  fetchLogs({ userId: e.target.value, page: 1 })
                }}
              />
            </div>

            {/* Cabang (if Super Admin) */}
            {isSuperAdmin ? (
              <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
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
              <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                Cabang Anda
              </div>
            )}
          </div>

          {/* Tier 2: Date Filters & Shortcuts & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Rentang Tanggal:</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPage(1)
                    fetchLogs({ startDate: e.target.value, page: 1 })
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <span className="text-slate-400 text-xs font-medium">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPage(1)
                    fetchLogs({ endDate: e.target.value, page: 1 })
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Quick Date Shortcuts */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-700 hover:bg-white transition"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('7days')}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-700 hover:bg-white transition"
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('month')}
                  className="px-2.5 py-1 rounded-lg font-medium text-slate-700 hover:bg-white transition"
                >
                  Bulan Ini
                </button>
              </div>
            </div>

            <div>
              <Button
                size="sm"
                variant="ghost"
                icon={RefreshCw}
                onClick={handleResetFilter}
                loading={isPending}
              >
                Reset Filter
              </Button>
            </div>
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
          title="Detail Audit Trail & Forensik"
        >
          <div className="p-6 space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Pengguna</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedLog.userName}</p>
                <p className="text-xs text-slate-500">{selectedLog.userRole}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Cabang</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {selectedLog.branch ? selectedLog.branch.name : 'Semua Cabang / Pusat'}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Tingkat & Kategori</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {getSeverityBadge(selectedLog.level || 'INFO')}
                  {getCategoryBadge(selectedLog.category)}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(selectedLog.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-700">
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>Aksi: {selectedLog.action}</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className={`p-4 rounded-2xl border ${
              selectedLog.level === 'CRITICAL'
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : selectedLog.level === 'WARNING'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-blue-50/60 border-blue-200 text-blue-950'
            }`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Deskripsi Aktivitas</p>
              <p className="text-sm font-semibold leading-relaxed">{selectedLog.description}</p>
            </div>

            {/* Visual Diff Table (If data was changed) */}
            {logDetailInfo && logDetailInfo.hasDiff && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Perubahan Data (Before vs After)</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="p-2.5">Field / Data</th>
                        <th className="p-2.5 bg-rose-50/50 text-rose-900">Nilai Sebelumnya</th>
                        <th className="p-2.5 bg-emerald-50/50 text-emerald-900">Nilai Sesudah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logDetailInfo.changes.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-medium text-slate-700 capitalize">
                            {c.field}
                          </td>
                          <td className="p-2.5 text-rose-700 bg-rose-50/30 line-through">
                            {c.before}
                          </td>
                          <td className="p-2.5 text-emerald-700 font-semibold bg-emerald-50/30">
                            {c.after}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Client Device & Forensics */}
            {(selectedLog.ipAddress || selectedLog.userAgent) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Informasi Jaringan & Perangkat</p>
                {selectedLog.ipAddress && (
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>IP: {formatIpAddress(selectedLog.ipAddress)}</span>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div className="flex items-start gap-2 text-slate-600 text-[11px] font-mono">
                    <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-all">{selectedLog.userAgent}</span>
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Payload (Toggleable) */}
            {selectedLog.details && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Payload / Data Teknis JSON</span>
                  <button
                    type="button"
                    onClick={() => setViewRawJson(!viewRawJson)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {viewRawJson ? 'Sembunyikan Raw JSON' : 'Tampilkan Raw JSON'}
                  </button>
                </div>
                {viewRawJson && (
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                    {selectedLog.details}
                  </pre>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Purge Modal (Super Admin Only) */}
      {showPurgeModal && (
        <Modal
          open={showPurgeModal}
          onClose={() => !isPurging && setShowPurgeModal(false)}
          title="Pembersihan & Retensi Audit Log"
        >
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900">Perhatian Sebelum Membersihkan Log</p>
                <p>
                  Tindakan ini akan menghapus permanen catatan log yang lebih tua dari batas waktu yang Anda tentukan. Aksi pembersihan ini akan tetap dicatat dalam audit trail sistem.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hapus log yang lebih tua dari:
              </label>
              <Select
                options={[
                  { label: '30 Hari Terakhir (Simpan log 30 hari)', value: '30' },
                  { label: '60 Hari Terakhir (Simpan log 60 hari)', value: '60' },
                  { label: '90 Hari Terakhir (Rekomendasi)', value: '90' },
                  { label: '180 Hari Terakhir (6 Bulan)', value: '180' },
                ]}
                value={String(purgeDays)}
                onChange={(e) => setPurgeDays(Number(e.target.value))}
                disabled={isPurging}
              />
            </div>

            {purgeFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                purgeFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {purgeFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={handlePurgeLogs}
                loading={isPurging}
              >
                Bersihkan Log Sekarang
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
