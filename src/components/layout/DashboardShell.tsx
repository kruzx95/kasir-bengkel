'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface SidebarContextType {
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({ openSidebar: () => {} })

export function useSidebar() {
  return useContext(SidebarContext)
}

interface DashboardShellProps {
  role: 'ADMIN' | 'KASIR'
  userName: string
  branchName: string | null
  children: React.ReactNode
}

export default function DashboardShell({ role, userName, branchName, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          role={role}
          userName={userName}
          branchName={branchName}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300 w-full min-w-0">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
