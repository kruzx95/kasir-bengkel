'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/layout/DashboardShell'

export default function MobileMenuButton() {
  const { openSidebar } = useSidebar()

  return (
    <button
      onClick={openSidebar}
      className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      aria-label="Buka menu navigasi"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
