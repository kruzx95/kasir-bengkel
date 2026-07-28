'use client'

import { createContext, useContext } from 'react'
import type { NotificationItem } from '@/actions/notification'

interface NotificationContextValue {
  items: NotificationItem[]
  count: number
}

const NotificationContext = createContext<NotificationContextValue>({ items: [], count: 0 })

export function NotificationProvider({
  value,
  children,
}: {
  value: NotificationContextValue
  children: React.ReactNode
}) {
  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext)
}