'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { getNotifications } from '@/actions/notification'
import type { NotificationItem } from '@/actions/notification'

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
  shopName: string
  children: React.ReactNode
}

export default function DashboardShell({ role, userName, branchName, shopName, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationData, setNotificationData] = useState<{ items: NotificationItem[]; count: number }>({ 
    items: [], 
    count: 0 
  })
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  // Fetch notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getNotifications()
        setNotificationData(data)
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }
    loadNotifications()
  }, [])

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          role={role}
          userName={userName}
          branchName={branchName}
          shopName={shopName}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
          <Header
            title={shopName}
            subtitle={branchName ?? 'Semua Cabang'}
            openSidebar={openSidebar}
            notificationData={notificationData}
          />
          <main className="flex-1 w-full min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}