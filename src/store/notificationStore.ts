import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  subscribeToNotifications: (userId: string) => () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  fetchNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching notifications:', error)
      set({ loading: false })
      return
    }
    const unreadCount = data?.filter(n => !n.read).length ?? 0
    set({ notifications: data ?? [], unreadCount, loading: false })
  },
  markAsRead: async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    const notifications = get().notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    const unreadCount = notifications.filter(n => !n.read).length
    set({ notifications, unreadCount })
  },
  markAllRead: async (userId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    const notifications = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications, unreadCount: 0 })
  },
  subscribeToNotifications: (userId: string) => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
