import { create } from 'zustand'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoNotifications } from '../lib/demoData'
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
    if (isDemoMode) {
      const unreadCount = demoNotifications.filter(n => !n.read).length
      set({
        notifications: demoNotifications as unknown as Notification[],
        unreadCount,
        loading: false,
      })
      return
    }
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
    if (!isDemoMode) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
    }
    const notifications = get().notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    const unreadCount = notifications.filter(n => !n.read).length
    set({ notifications, unreadCount })
  },
  markAllRead: async (userId: string) => {
    if (!isDemoMode) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    }
    const notifications = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications, unreadCount: 0 })
  },
  subscribeToNotifications: (userId: string) => {
    if (isDemoMode) {
      return () => {} // no-op cleanup
    }
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
