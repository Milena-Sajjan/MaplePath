import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { useAuthStore } from '../store/authStore'

export function useNotifications() {
  const { user } = useAuthStore()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    subscribeToNotifications,
  } = useNotificationStore()

  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id)
    const unsubscribe = subscribeToNotifications(user.id)
    return unsubscribe
  }, [user, fetchNotifications, subscribeToNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead: () => user && markAllRead(user.id),
  }
}
