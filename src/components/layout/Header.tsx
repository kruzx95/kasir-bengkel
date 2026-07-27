'use client'

import MobileMenuButton from './MobileMenuButton'
import NotificationPanel from './NotificationPanel'

interface HeaderProps {
  title: string
  subtitle?: string
  openSidebar: () => void
  notificationData?: {
    items: Array<{
      id: string
      type: 'LOW_STOCK' | 'INDENT_OVERDUE' | 'CORPORATE_PENDING'
      title: string
      message: string
      href: string
      severity: 'warning' | 'danger' | 'info'
      date?: string | Date
    }>
    count: number
  }
}

export default function Header({ title, subtitle, openSidebar, notificationData }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger menu — client component */}
          <MobileMenuButton onClick={openSidebar} />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Panel */}
          <NotificationPanel initialData={notificationData} />
        </div>
      </div>
    </header>
  )
}