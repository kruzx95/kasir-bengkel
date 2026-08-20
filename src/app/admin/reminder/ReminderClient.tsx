'use client'

import { useState, useTransition } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { getCustomersDueForService, markReminderSent } from '@/actions/reminder'
import { MessageCircle, CheckCircle2, Car, CalendarClock, History } from 'lucide-react'

type ReminderData = Awaited<ReturnType<typeof getCustomersDueForService>>[0]

interface ReminderClientProps {
  initialData: ReminderData[]
  branches: { id: string; name: string }[]
  defaultMonths: number
  shopName: string
  waTemplate?: string
}

export default function ReminderClient({
  initialData,
  branches,
  defaultMonths,
  shopName,
  waTemplate,
}: ReminderClientProps) {
  const [data, setData] = useState(initialData)
  const [months, setMonths] = useState(defaultMonths)
  const [branchId, setBranchId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleFilter = () => {
    startTransition(async () => {
      const result = await getCustomersDueForService(months, branchId || undefined)
      setData(result)
    })
  }

  const handleMarkSent = async (customerId: string) => {
    setUpdatingId(customerId)
    const res = await markReminderSent(customerId)
    if (res.success) {
      // Remove from list
      setData(data.filter(d => d.id !== customerId))
    } else {
      alert(res.message)
    }
    setUpdatingId(null)
  }

  const generateWaLink = (row: ReminderData) => {
    let phone = row.phone || ''
    // Format to 62...
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)
    if (!phone) return '#'

    const dateStr = new Date(row.lastServiceDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const vehicle = [row.vehicleBrand, row.vehicleType].filter(Boolean).join(' ') || 'Motor'
    const plate = row.plateNumber || 'Tanpa Plat'

    const templateToUse =
      waTemplate ||
      `Halo Bapak/Ibu {nama_pelanggan},\n\nKami dari *{nama_toko}* ingin mengingatkan bahwa kendaraan kesayangan Anda {kendaraan} ({plat_nomor}) sudah waktunya untuk diservis rutin / ganti oli, karena sudah {bulan_telat} bulan sejak servis terakhir pada {tanggal_servis}.\n\nDitunggu kedatangannya di bengkel kami ya! 🙏`

    const text = templateToUse
      .replaceAll('{nama_pelanggan}', row.name)
      .replaceAll('{nama_toko}', shopName)
      .replaceAll('{kendaraan}', vehicle)
      .replaceAll('{plat_nomor}', plate)
      .replaceAll('{tanggal_servis}', dateStr)
      .replaceAll('{bulan_telat}', String(months))

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  const columns = [
    {
      key: 'customer',
      header: 'Pelanggan',
      render: (row: ReminderData) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.phone || 'Tidak ada no HP'}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Kendaraan',
      render: (row: ReminderData) => (
        <div>
          <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Car className="w-3.5 h-3.5" /> 
            {[row.vehicleBrand, row.vehicleType].filter(Boolean).join(' ') || '—'}
          </p>
          {row.plateNumber && <p className="text-xs font-mono text-slate-500">{row.plateNumber}</p>}
        </div>
      ),
    },
    {
      key: 'lastService',
      header: 'Servis Terakhir',
      render: (row: ReminderData) => (
        <div>
          <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
            {new Date(row.lastServiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <div className="flex items-start gap-1 mt-1 text-xs text-slate-500">
            <History className="w-3 h-3 mt-0.5 shrink-0" />
            <p className="line-clamp-2 max-w-[200px]" title={row.lastServiceItems.join(', ')}>
              {row.lastServiceItems.join(', ') || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi Follow-up',
      className: 'text-right w-64',
      render: (row: ReminderData) => (
        <div className="flex flex-col gap-2 justify-end items-end">
          <a 
            href={generateWaLink(row)} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!row.phone) {
                e.preventDefault()
                alert('Tidak ada nomor WhatsApp yang tersimpan untuk pelanggan ini.')
              }
            }}
          >
            <Button 
              size="sm" 
              icon={MessageCircle} 
              className={row.phone ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed border-none hover:bg-slate-300'}
            >
              Hubungi via WA
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            icon={CheckCircle2}
            className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200 text-xs w-full"
            loading={updatingId === row.id}
            onClick={() => handleMarkSent(row.id)}
          >
            Tandai Sudah Follow-up
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="w-full md:w-64">
          <Select
            label="Ambang Batas Waktu"
            value={months.toString()}
            onChange={(e) => setMonths(Number(e.target.value))}
            options={[
              { label: 'Belum servis > 1 Bulan', value: '1' },
              { label: 'Belum servis > 2 Bulan', value: '2' },
              { label: 'Belum servis > 3 Bulan', value: '3' },
              { label: 'Belum servis > 6 Bulan', value: '6' },
            ]}
          />
        </div>
        <div className="w-full md:w-64">
          <Select
            label="Cabang"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            options={[
              { label: 'Semua Cabang', value: '' },
              ...branches.map(b => ({ label: b.name, value: b.id }))
            ]}
          />
        </div>
        <Button onClick={handleFilter} loading={isPending}>Terapkan</Button>
      </div>

      {/* Info Badge */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <CalendarClock className="w-4 h-4 text-primary-500" />
        <p>Menampilkan <strong>{data.length} pelanggan</strong> yang servis terakhirnya lebih dari {months} bulan yang lalu dan belum dihubungi kembali.</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={data}
          keyExtractor={(row) => row.id}
          emptyMessage={`Bagus! Tidak ada pelanggan yang terlewat lebih dari ${months} bulan.`}
        />
      </div>
    </div>
  )
}
