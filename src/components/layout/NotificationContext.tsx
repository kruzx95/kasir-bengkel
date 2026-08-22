'use client'

import { createContext, useContext } from 'react'
import type { NotificationItem, NotificationSummary } from '@/actions/notification'

interface NotificationContextValue {
  items: NotificationItem[]
  count: number
  summary: NotificationSummary
}

const defaultSummary: NotificationSummary = { lowStock: 0, indentOverdue: 0, corporatePending: 0 }

const NotificationContext = createContext<NotificationContextValue>({
  items: [],
  count: 0,
  summary: defaultSummary
})

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