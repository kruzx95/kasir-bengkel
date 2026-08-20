'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, X, Check, Loader2 } from 'lucide-react'
import { searchCustomers } from '@/actions/customer'

export interface CustomerOption {
  id: string
  name: string
  plateNumber: string | null
  phone?: string | null
  corporateCustomerId: string | null
  odometer: number | null
}

interface CustomerAutocompleteProps {
  initialCustomers: CustomerOption[]
  selectedId: string
  branchId?: string | null
  inputRef?: React.RefObject<HTMLInputElement | null>
  onSelect: (customer: CustomerOption | null) => void
}

export default function CustomerAutocomplete({
  initialCustomers,
  selectedId,
  branchId,
  inputRef,
  onSelect,
}: CustomerAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<CustomerOption[]>(initialCustomers)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedCustomer = options.find((c) => c.id === selectedId) || initialCustomers.find((c) => c.id === selectedId)

  // Debounced search via server action if query typed
  useEffect(() => {
    if (!query.trim()) {
      setOptions(initialCustomers)
      setHighlightIndex(0)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchCustomers(query, branchId)
        setOptions(results as CustomerOption[])
        setHighlightIndex(0)
      } catch (err) {
        console.error('Customer search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, branchId, initialCustomers])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        Pelanggan (Opsional)
      </label>

      {selectedCustomer ? (
        <div className="flex items-center justify-between p-3 bg-primary-50/60 border border-primary-200 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {selectedCustomer.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {selectedCustomer.plateNumber ? `Plat: ${selectedCustomer.plateNumber}` : 'Tanpa Plat'}
                {selectedCustomer.phone ? ` · HP: ${selectedCustomer.phone}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null)
              setQuery('')
            }}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-2 shrink-0"
            title="Ganti / Lepas Pelanggan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari nama, plat nomor, atau no. HP... [F1]"
            value={query}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setOpen(true)
                setHighlightIndex((prev) => (prev + 1 <= options.length ? prev + 1 : prev))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (open) {
                  if (highlightIndex === 0) {
                    onSelect(null)
                  } else if (options[highlightIndex - 1]) {
                    onSelect(options[highlightIndex - 1])
                  }
                  setOpen(false)
                  setQuery('')
                }
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
          )}

          {open && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200/80 max-h-60 overflow-y-auto divide-y divide-slate-50">
              <button
                type="button"
                onClick={() => {
                  onSelect(null)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                  highlightIndex === 0 ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-slate-50 text-slate-500'
                }`}
              >
                <span>Pelanggan Umum (Tanpa Nama)</span>
                {!selectedId && <Check className="w-3.5 h-3.5 text-primary-600" />}
              </button>

              {options.length > 0 ? (
                options.map((cust, idx) => {
                  const isHighlighted = highlightIndex === idx + 1
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        onSelect(cust)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between group transition-colors ${
                        isHighlighted ? 'bg-primary-50 text-primary-900 font-semibold' : 'hover:bg-primary-50/50'
                      }`}
                    >
                      <div>
                        <p className={`text-sm ${isHighlighted ? 'text-primary-900 font-bold' : 'font-semibold text-slate-900'}`}>
                          {cust.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {cust.plateNumber ? `Plat: ${cust.plateNumber}` : ''}
                          {cust.plateNumber && cust.phone ? ' · ' : ''}
                          {cust.phone ? `HP: ${cust.phone}` : ''}
                        </p>
                      </div>
                      {cust.id === selectedId && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                    </button>
                  )
                })
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  {query ? `Tidak ada pelanggan yang cocok dengan "${query}"` : 'Tidak ada data pelanggan'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
