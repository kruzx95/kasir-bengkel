'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  PlusCircle,
  Search,
  Printer,
  Edit2,
  CheckCircle,
  Play,
  Clock,
  Car,
  User,
  Wrench,
  Package,
  Calendar,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { MEMO_STATUS_MAP } from '@/lib/memo-constants'
import { updateMemoStatus } from '@/actions/memo'
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
  user: { id: string; name: string } | null
  services: Array<{ id: string; name: string; estimatedPrice: number }>
  spareparts: Array<{ id: string; name: string; quantity: number; unit: string; estimatedPrice: number }>
}

interface MekanikDashboardClientProps {
  initialMemos: ServiceMemoItem[]
  totalCount: number
}

export default function MekanikDashboardClient({
  initialMemos,
  totalCount,
}: MekanikDashboardClientProps) {
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

  // Quick stats
  const countToday = initialMemos.length
  const countInProgress = initialMemos.filter((m) => m.status === 'IN_PROGRESS').length
  const countCompleted = initialMemos.filter((m) => m.status === 'COMPLETED' || m.status === 'CONVERTED').length

  const handleStatusChange = (id: string, newStatus: MemoStatus) => {
    startTransition(async () => {
      const res = await updateMemoStatus(id, newStatus)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Portal Service Advisor (SA) & Mekanik
          </h1>
          <p className="text-sm text-slate-500">
            Pencatatan keluhan, diagnosa kerusakan, checklist servis & kebutuhan part
          </p>
        </div>

        <Link href="/mekanik/baru">
          <Button
            variant="primary"
            icon={PlusCircle}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
          >
            Buat Memo Baru
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-linear-to-br from-purple-50 to-white border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
                Total Memo Masuk
              </p>
              <p className="text-2xl font-black text-slate-900">{totalCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-linear-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                Sedang Dikerjakan
              </p>
              <p className="text-2xl font-black text-slate-900">{countInProgress}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-linear-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                Selesai / Jadi Invoice
              </p>
              <p className="text-2xl font-black text-slate-900">{countCompleted}</p>
            </div>
          </div>
        </Card>
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

      {/* Memos List Cards */}
      {filteredMemos.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">Belum ada Memo Servis</p>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol &quot;Buat Memo Baru&quot; untuk mencatat keluhan dan diagnosa kendaraan masuk.
          </p>
          <Link href="/mekanik/baru" className="inline-block mt-4">
            <Button size="sm" variant="primary" icon={PlusCircle} className="bg-purple-600">
              Buat Memo Pertama
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemos.map((m) => {
            const statusConfig = MEMO_STATUS_MAP[m.status] || { label: m.status, variant: 'default' }
            const dateStr = new Intl.DateTimeFormat('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(m.createdAt))

            return (
              <Card
                key={m.id}
                className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                          {m.memoNumber}
                        </span>
                        {m.queueNumber && (
                          <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            Antrian: {m.queueNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateStr}
                      </p>
                    </div>

                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Vehicle & Customer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono font-black text-base text-slate-900 tracking-wide">
                        {m.vehiclePlate}
                      </span>
                      {m.vehicleModel && (
                        <span className="text-xs text-slate-500 font-medium truncate">
                          • {m.vehicleModel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{m.customerName}</span>
                      {m.customerPhone && <span>({m.customerPhone})</span>}
                    </div>

                    {m.mechanic && (
                      <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50/70 px-2 py-1 rounded-md">
                        <Wrench className="w-3 h-3 shrink-0" />
                        <span>Mekanik: <strong>{m.mechanic.name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Complaints snippet */}
                  {m.complaints && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-0.5">
                      <p className="font-semibold text-slate-700">Keluhan:</p>
                      <p className="line-clamp-2 italic text-[11px]">&quot;{m.complaints}&quot;</p>
                    </div>
                  )}

                  {/* Summary items */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>{m.services.length} Jasa</span>
                    <span>•</span>
                    <span>{m.spareparts.length} Sparepart</span>
                    {m.odometer && (
                      <>
                        <span>•</span>
                        <span>{m.odometer.toLocaleString('id-ID')} KM</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/cetak-memo/${m.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Printer}
                        className="text-xs py-1 px-2.5 h-auto text-slate-700"
                        title="Cetak Form Memo (A4)"
                      >
                        Cetak
                      </Button>
                    </Link>

                    {m.status !== 'CONVERTED' && (
                      <Link href={`/mekanik/${m.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Edit2}
                          className="text-xs py-1 px-2.5 h-auto border-purple-200 text-purple-700 hover:bg-purple-50"
                          title="Edit Memo"
                        >
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Quick status stepper */}
                  <div>
                    {m.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Play}
                        disabled={isPending}
                        onClick={() => handleStatusChange(m.id, 'IN_PROGRESS')}
                        className="text-xs py-1 px-2.5 h-auto bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      >
                        Mulai Kerjakan
                      </Button>
                    )}
                    {m.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={CheckCircle}
                        disabled={isPending}
                        onClick={() => handleStatusChange(m.id, 'COMPLETED')}
                        className="text-xs py-1 px-2.5 h-auto bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      >
                        Selesai Servis
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
