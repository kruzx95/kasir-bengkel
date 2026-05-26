import MobileMenuButton from './MobileMenuButton'
import NotificationPanel from './NotificationPanel'
import { getNotifications } from '@/actions/notification'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default async function Header({ title, subtitle }: HeaderProps) {
  // Fetch notifikasi langsung di server (tidak perlu loading state di client)
  const notifications = await getNotifications()

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger menu — client component */}
          <MobileMenuButton />

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Panel */}
          <NotificationPanel initialData={notifications} />
        </div>
      </div>
    </header>
  )
}
