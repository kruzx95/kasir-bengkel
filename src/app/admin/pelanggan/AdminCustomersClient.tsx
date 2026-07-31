'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CustomerFormModal from '@/components/kasir/CustomerFormModal'
import BulkAddCustomerModal from '@/components/admin/BulkAddCustomerModal'
import { deleteCustomer } from '@/actions/customer'
import { Plus, Pencil, Users, Search, Bike, FlaskConical, Trash2, AlertTriangle } from 'lucide-react'

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
  corporateCustomerId?: string | null
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
  corporateList?: Array<{ id: string; name: string }>
}

export default function AdminCustomersClient({ initialCustomers, branches, initialBranch, totalCount, corporateList }: AdminCustomersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<CustomerRow | null>(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ success: boolean; text: string } | null>(null)
  
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

  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    setDeleteMsg(null)
    const res = await deleteCustomer(id)
    setDeleteLoading(false)
    if (res.success) {
      setDeleteConfirmId(null)
      setDeleteMsg({ success: true, text: res.message })
      router.refresh()
      setTimeout(() => setDeleteMsg(null), 4000)
    } else {
      setDeleteMsg({ success: false, text: res.message })
    }
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
      className: 'text-right w-24',
      render: (row: CustomerRow) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => handleEdit(row)}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => {
              setDeleteConfirmId(row.id)
              setDeleteMsg(null)
            }}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
          />
        </div>
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
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button
            icon={FlaskConical}
            variant="ghost"
            className="w-full sm:w-auto border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400"
            onClick={() => setBulkModalOpen(true)}
          >
            Bulk Add Testing
          </Button>
          <Button
            icon={Plus}
            className="w-full sm:w-auto"
            onClick={() => {
              setEditData(null)
              setModalOpen(true)
            }}
          >
            Tambah Pelanggan
          </Button>
        </div>
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
        key={modalOpen ? `customer-modal-${editData?.id || 'new'}` : 'customer-modal-closed'}
        open={modalOpen}
        onClose={handleClose}
        branches={branches}
        editData={editData}
        isAdmin
        corporateList={
          corporateList?.map(c => ({
            value: c.id,
            label: c.name,
          }))
        }
      />

      <BulkAddCustomerModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        branches={branches}
        corporateList={corporateList || []}
      />

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (() => {
        const target = initialCustomers.find(c => c.id === deleteConfirmId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDeleteConfirmId(null); setDeleteMsg(null) }} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 animate-fade-in">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Hapus Pelanggan?</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Anda akan menghapus <span className="font-semibold text-slate-800">{target?.name}</span>.
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>

                {deleteMsg && !deleteMsg.success && (
                  <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{deleteMsg.text}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeleteConfirmId(null); setDeleteMsg(null) }}
                  disabled={deleteLoading}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleteLoading}
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                >
                  {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Toast sukses ── */}
      {deleteMsg?.success && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/20 animate-fade-in text-sm font-medium">
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full" />
          {deleteMsg.text}
        </div>
      )}
    </>
  )
}
