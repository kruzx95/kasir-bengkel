'use client'

import MobileMenuButton from './MobileMenuButton'
import NotificationPanel from './NotificationPanel'
import { useNotifications } from './NotificationContext'
import { useSidebar } from './DashboardShell'
import type { NotificationResponse } from '@/actions/notification'

interface HeaderProps {
  title: string
  subtitle?: string
  notificationData?: NotificationResponse
}

/**
 * Header pintar — auto-ambil:
 * - `openSidebar` dari SidebarContext (di-provide oleh DashboardShell)
 * - `notifications` dari NotificationContext (di-provide oleh DashboardShell)
 *
 * Digunakan langsung di page.tsx sebagai <Header title="..." subtitle="..." />
 * — tidak perlu pass openSidebar lagi (state mobile menu),
 * notifikasi otomatis sinkron dari sidebar Shell.
 */
export default function Header({ title, subtitle, notificationData }: HeaderProps) {
  const { openSidebar } = useSidebar()
  const ctx = useNotifications()
  const data = notificationData ?? ctx

  return (
    <div className="sticky top-2 sm:top-3 z-30 px-3 sm:px-4 print:hidden">
      <header className="bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-sm shadow-slate-200/40 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger menu — client component */}
            <MobileMenuButton onClick={openSidebar} />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications Panel */}
            <NotificationPanel initialData={data} />
          </div>
        </div>
      </header>
    </div>
  )
}