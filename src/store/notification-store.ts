'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  link?: string
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString(),
          }
          const notifications = [newNotification, ...state.notifications]
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id)
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          }
        }),
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        }),
    }),
    {
      name: 'diamond-solar-notifications',
    }
  )
)
