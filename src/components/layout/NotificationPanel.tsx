'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, Info, AlertCircle, PackageOpen } from 'lucide-react'
import Link from 'next/link'
import type { NotificationItem } from '@/actions/notification'

interface NotificationPanelProps {
  initialData: {
    items: NotificationItem[]
    count: number
  }
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

  const { items, count } = initialData

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'LOW_STOCK': return <PackageOpen className="w-5 h-5 text-warning-500" />
      case 'INDENT_OVERDUE': return <AlertCircle className="w-5 h-5 text-danger-500" />
      case 'CORPORATE_PENDING': return <Info className="w-5 h-5 text-sky-500" />
      default: return <AlertTriangle className="w-5 h-5 text-slate-500" />
    }
  }

  const getBgColor = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'danger': return 'bg-danger-50 border-danger-100'
      case 'warning': return 'bg-warning-50 border-warning-100'
      case 'info': return 'bg-sky-50 border-sky-100'
      default: return 'bg-slate-50 border-slate-100'
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
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Notifikasi</h3>
            <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-700 rounded-lg">
              {count} Baru
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-slate-900 font-medium">Semua baik-baik saja 🎉</p>
                <p className="text-sm text-slate-500 mt-1">Tidak ada peringatan atau tindakan yang diperlukan saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors border-l-4 ${getBgColor(item.severity)} border-y-0 border-r-0`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{item.message}</p>
                      {item.date && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <p className="text-xs text-slate-500">Notifikasi diupdate otomatis secara real-time</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
