'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CustomerFormModal from '@/components/kasir/CustomerFormModal'
import { Plus, Pencil, Users, Search, Bike, Filter } from 'lucide-react'

interface CustomerRow {
  id: string
  name: string
  phone: string | null
  address: string | null
  plateNumber: string | null
  vehicleBrand: string | null
  vehicleType: string | null
  vehicleColor: string | null
  vehicleYear: string | null
  fuelType: string | null
  odometer: number | null
  branchId: string
  branch: {
    id: string
    code: string
    name: string
  }
}

interface AdminCustomersClientProps {
  initialCustomers: CustomerRow[]
  branches: { id: string; name: string }[]
  initialBranch: string
  totalCount: number
}

export default function AdminCustomersClient({ initialCustomers, branches, initialBranch, totalCount }: AdminCustomersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CustomerRow | null>(null)
  
  const initialSearch = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedBranch, setSelectedBranch] = useState(initialBranch)

  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  // Apply filters
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        if (selectedBranch) {
          params.set('branch', selectedBranch)
        } else {
          params.delete('branch')
        }
        params.set('page', '1')
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedBranch, pathname, router])

  const handleEdit = (customer: CustomerRow) => {
    setEditData(customer)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Pelanggan',
      render: (row: CustomerRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            {row.phone && (
              <p className="text-xs text-slate-400">{row.phone}</p>
            )}
            <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{row.branch?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      header: 'Plat Nomor',
      render: (row: CustomerRow) => (
        row.plateNumber ? (
          <Badge variant="default" size="md" className="font-mono">
            {row.plateNumber}
          </Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: 'vehicle',
      header: 'Kendaraan',
      render: (row: CustomerRow) => (
        row.vehicleType || row.vehicleBrand ? (
          <div className="flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-700">
              {[row.vehicleBrand, row.vehicleType].filter(Boolean).join(' ')}
              {row.vehicleYear ? ` (${row.vehicleYear})` : ''}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right w-16',
      render: (row: CustomerRow) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Pencil}
          onClick={() => handleEdit(row)}
        />
      ),
    },
  ]

  return (
    <>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-end gap-3">
        <div className="w-full sm:flex-1 relative">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cari</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, plat nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
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
        <Button
          icon={Plus}
          className="w-full sm:w-auto shrink-0"
          onClick={() => {
            setEditData(null)
            setModalOpen(true)
          }}
        >
          Tambah Pelanggan
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-500">
          {initialCustomers.length} item dari total {totalCount} pelanggan (halaman ini)
        </p>
        {isPending && <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />}
      </div>

      <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={initialCustomers}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada pelanggan terdaftar."
        />
      </div>

      <CustomerFormModal
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
      />
    </>
  )
}
