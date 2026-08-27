'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Printer,
  Receipt,
  Edit2,
  Trash2,
  Car,
  User,
  Wrench,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import { MEMO_STATUS_MAP } from '@/lib/memo-constants'
import { deleteMemo } from '@/actions/memo'
import { MemoStatus } from '@/generated/prisma/client'

interface ServiceMemoItem {
  id: string
  memoNumber: string
  queueNumber: string | null
  customerName: string
  customerPhone: string | null
  vehiclePlate: string
  vehicleModel: string | null
  odometer: number | null
  complaints: string | null
  initialDiagnosis: string | null
  estimatedDuration: string | null
  status: MemoStatus
  createdAt: Date | string
  mechanic: { id: string; name: string } | null
  user: { id: string; name: string; role: string } | null
  services: Array<{ id: string; name: string; estimatedPrice: number }>
  spareparts: Array<{ id: string; name: string; quantity: number; unit: string; estimatedPrice: number }>
}

interface KasirMemoClientProps {
  initialMemos: ServiceMemoItem[]
  totalCount: number
  isAdmin?: boolean
}

export default function KasirMemoClient({
  initialMemos,
  totalCount,
  isAdmin = false,
}: KasirMemoClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filteredMemos = initialMemos.filter((m) => {
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.memoNumber.toLowerCase().includes(q) ||
      m.vehiclePlate.toLowerCase().includes(q) ||
      m.customerName.toLowerCase().includes(q) ||
      (m.vehicleModel && m.vehicleModel.toLowerCase().includes(q))
    )
  })

  const handleDelete = (id: string, memoNumber: string) => {
    if (!confirm(`Yakin ingin menghapus memo ${memoNumber}?`)) return
    startTransition(async () => {
      const res = await deleteMemo(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  const basePath = isAdmin ? '/admin' : '/kasir'

  const columns = [
    {
      key: 'memo',
      header: 'No. Memo & Antrian',
      render: (row: ServiceMemoItem) => {
        const dateStr = new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(row.createdAt))

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                {row.memoNumber}
              </span>
              {row.queueNumber && (
                <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  #{row.queueNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {dateStr}
            </p>
          </div>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Kendaraan & Pelanggan',
      render: (row: ServiceMemoItem) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-sm text-slate-900">
              {row.vehiclePlate}
            </span>
            {row.vehicleModel && (
              <span className="text-xs text-slate-500 font-medium">
                ({row.vehicleModel})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {row.customerName} {row.customerPhone ? `• ${row.customerPhone}` : ''}
          </p>
          {row.odometer && (
            <p className="text-[11px] text-slate-400 font-mono">
              Odometer: {row.odometer.toLocaleString('id-ID')} KM
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Keluhan & Mekanik',
      render: (row: ServiceMemoItem) => (
        <div className="space-y-1 max-w-xs text-xs">
          {row.complaints ? (
            <p className="line-clamp-2 text-slate-600 italic">
              &quot;{row.complaints}&quot;
            </p>
          ) : (
            <span className="text-slate-400">-</span>
          )}
          {row.mechanic && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
              <Wrench className="w-3 h-3" />
              {row.mechanic.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Rincian Item',
      render: (row: ServiceMemoItem) => {
        const estService = row.services.reduce((acc, s) => acc + (s.estimatedPrice || 0), 0)
        const estSparepart = row.spareparts.reduce(
          (acc, sp) => acc + (sp.estimatedPrice || 0) * (sp.quantity || 1),
          0
        )
        const totalEst = estService + estSparepart

        return (
          <div className="text-xs font-mono space-y-0.5">
            <p className="text-slate-600 font-sans">
              {row.services.length} Jasa, {row.spareparts.length} Part
            </p>
            {totalEst > 0 ? (
              <p className="text-emerald-700 font-bold">
                Est: Rp {totalEst.toLocaleString('id-ID')}
              </p>
            ) : (
              <p className="text-slate-400 text-[11px] font-sans">Est. belum diisi</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ServiceMemoItem) => {
        const statusConfig = MEMO_STATUS_MAP[row.status] || {
          label: row.status,
          variant: 'default',
        }
        return (
          <Badge variant={statusConfig.variant} size="sm">
            {statusConfig.label}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: ServiceMemoItem) => (
        <div className="flex items-center gap-1.5">
          {/* Tombol Cetak Form Fisik */}
          <Link href={`/cetak-memo/${row.id}`}>
            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              className="text-xs py-1 px-2.5 h-auto text-slate-700 hover:bg-slate-100"
              title="Cetak Form Memo Fisik"
            >
              Cetak
            </Button>
          </Link>

          {/* Tombol Konversi ke Transaksi POS Kasir */}
          {row.status !== 'CONVERTED' ? (
            <Link href={`${basePath}/transaksi/baru?memoId=${row.id}`}>
              <Button
                size="sm"
                variant="primary"
                icon={Receipt}
                className="text-xs py-1 px-2.5 h-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                title="Konversi memo ini menjadi Transaksi Kasir / Faktur"
              >
                Buat Invoice
              </Button>
            </Link>
          ) : (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" /> Sudah Jadi Nota
            </span>
          )}

          {/* Edit Button */}
          {row.status !== 'CONVERTED' && (
            <Link href={`/mekanik/${row.id}`}>
              <button
                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Edit Memo"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </Link>
          )}

          {/* Delete Button (If Admin) */}
          {isAdmin && row.status !== 'CONVERTED' && (
            <button
              onClick={() => handleDelete(row.id, row.memoNumber)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus Memo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Daftar Memo Servis (Service Advisor)
          </h1>
          <p className="text-sm text-slate-500">
            Data memo diagnosa dari SA/Kepala Mekanik, cetak form fisik, dan konversi ke transaksi kasir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/mekanik/baru">
            <Button
              variant="primary"
              icon={Plus}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Buat Memo Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Plat Nomor, Nama Pemilik, atau No Memo..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CONVERTED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua' : MEMO_STATUS_MAP[st]?.label || st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table columns={columns} data={filteredMemos} keyExtractor={(row) => row.id} />
      </Card>
    </div>
  )
}
