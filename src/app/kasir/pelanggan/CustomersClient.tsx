'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CustomerFormModal from '@/components/kasir/CustomerFormModal'
import { Plus, Pencil, Users, Search, Bike } from 'lucide-react'

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

interface CustomersClientProps {
  initialCustomers: CustomerRow[]
  branchId: string
  totalCount: number
}

export default function CustomersClient({ initialCustomers, branchId, totalCount }: CustomersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CustomerRow | null>(null)
  
  const initialSearch = searchParams.get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('search', searchQuery)
        } else {
          params.delete('search')
        }
        params.set('page', '1') // reset to page 1 on new search
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router, searchParams])

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
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, plat nomor, atau no. HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          )}
        </div>
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

      {/* Count */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-500">
          {initialCustomers.length} item dari total {totalCount} pelanggan (halaman ini)
        </p>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          columns={columns}
          data={initialCustomers}
          keyExtractor={(row) => row.id}
          emptyMessage="Belum ada pelanggan terdaftar."
        />
      </div>

      {/* Modal */}
      <CustomerFormModal
        open={modalOpen}
        onClose={handleClose}
        branchId={branchId}
        editData={editData}
      />
    </>
  )
}
