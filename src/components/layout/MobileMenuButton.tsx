'use client'

import { Menu } from 'lucide-react'

interface MobileMenuButtonProps {
  onClick: () => void
}

export default function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      aria-label="Buka menu navigasi"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
