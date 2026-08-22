'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Bell, AlertTriangle, Info, AlertCircle, PackageOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { NotificationItem, NotificationSummary } from '@/actions/notification'

interface NotificationPanelProps {
  initialData?: {
    items: NotificationItem[]
    count: number
    summary: NotificationSummary
  }
}

interface NotificationGroup {
  type: NotificationItem['type']
  label: string
  icon: React.ReactNode
  items: NotificationItem[]
  totalCount: number
  viewAllHref: string
  severity: 'danger' | 'warning' | 'info'
}

export default function NotificationPanel({ initialData }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const { items = [], count = 0, summary } = initialData || {}
  const safeSum = summary || { lowStock: 0, indentOverdue: 0, corporatePending: 0 }

  // Group items by type
  const groups = useMemo<NotificationGroup[]>(() => {
    const grouped: NotificationGroup[] = []

    // Low Stock group
    const lowStockItems = items.filter(i => i.type === 'LOW_STOCK')
    if (safeSum.lowStock > 0 || lowStockItems.length > 0) {
      grouped.push({
        type: 'LOW_STOCK',
        label: 'Stok Menipis',
        icon: <PackageOpen className="w-4 h-4" />,
        items: lowStockItems,
        totalCount: safeSum.lowStock,
        viewAllHref: '/admin/master/spareparts',
        severity: lowStockItems.some(i => i.severity === 'danger') ? 'danger' : 'warning'
      })
    }

    // Indent Overdue group
    const indentItems = items.filter(i => i.type === 'INDENT_OVERDUE')
    if (safeSum.indentOverdue > 0 || indentItems.length > 0) {
      grouped.push({
        type: 'INDENT_OVERDUE',
        label: 'Indent Terlambat',
        icon: <AlertCircle className="w-4 h-4" />,
        items: indentItems,
        totalCount: safeSum.indentOverdue,
        viewAllHref: '/admin/indent',
        severity: 'danger'
      })
    }

    // Corporate Pending group
    const corpItems = items.filter(i => i.type === 'CORPORATE_PENDING')
    if (safeSum.corporatePending > 0 || corpItems.length > 0) {
      grouped.push({
        type: 'CORPORATE_PENDING',
        label: 'Tagihan Korporat Lama',
        icon: <Info className="w-4 h-4" />,
        items: corpItems,
        totalCount: safeSum.corporatePending,
        viewAllHref: '/admin/korporat',
        severity: 'warning'
      })
    }

    return grouped
  }, [items, safeSum])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'danger': return {
        badge: 'bg-danger-100 text-danger-700',
        header: 'bg-danger-50/60 border-danger-100',
        item: 'border-l-danger-400',
        icon: 'text-danger-500'
      }
      case 'warning': return {
        badge: 'bg-warning-100 text-warning-700',
        header: 'bg-warning-50/60 border-warning-100',
        item: 'border-l-warning-400',
        icon: 'text-warning-500'
      }
      default: return {
        badge: 'bg-sky-100 text-sky-700',
        header: 'bg-sky-50/60 border-sky-100',
        item: 'border-l-sky-400',
        icon: 'text-sky-500'
      }
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-colors ${
          isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
        }`}
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full border-2 border-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Notifikasi</h3>
            {count > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-danger-100 text-danger-700 rounded-lg">
                {count} Peringatan
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {groups.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-slate-900 font-medium">Semua baik-baik saja 🎉</p>
                <p className="text-sm text-slate-500 mt-1">Tidak ada peringatan atau tindakan yang diperlukan saat ini.</p>
              </div>
            ) : (
              <div>
                {groups.map((group) => {
                  const colors = getSeverityColor(group.severity)
                  return (
                    <div key={group.type}>
                      {/* Group Header */}
                      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${colors.header}`}>
                        <div className={`flex items-center gap-2 ${colors.icon}`}>
                          {group.icon}
                          <span className="text-sm font-semibold text-slate-800">{group.label}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {group.totalCount}
                        </span>
                      </div>

                      {/* Group Items */}
                      <div className="divide-y divide-slate-50">
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-l-[3px] ${
                              item.severity === 'danger' ? 'border-l-danger-400' : 
                              item.severity === 'warning' ? 'border-l-warning-400' : 'border-l-sky-400'
                            }`}
                          >
                            <div>
                              <p className="text-sm text-slate-700 line-clamp-2">{item.message}</p>
                              {item.date && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* "View All" link if there are more items than shown */}
                      {group.totalCount > group.items.length && (
                        <Link
                          href={group.viewAllHref}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50/50 transition-colors border-b border-slate-100"
                        >
                          Lihat semua {group.totalCount} item
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {groups.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <p className="text-xs text-slate-500">Menampilkan max 20 item per kategori</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
