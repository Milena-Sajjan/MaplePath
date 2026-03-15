import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import { isDemoMode } from '../../lib/supabase'
import { ToastProvider, ToastViewport } from '../ui/Toast'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import MobileNav from './MobileNav'

export default function AppLayout() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { fetchProfile } = useProfileStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Fetch profile when user is available
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 text-xs font-medium shadow-sm">
            🍁 Demo Mode — Showing sample data. Connect Supabase for full functionality.
          </div>
        )}

        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
              >
                <div className="flex h-full flex-col bg-[#1A3A2A] text-white">
                  <MobileSidebarContent />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div className={`md:pl-64 ${isDemoMode ? 'pt-8' : ''}`}>
          <TopNav onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

          <main className="pb-20 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />

        <ToastViewport />
      </div>
    </ToastProvider>
  )
}

/**
 * Duplicates the sidebar content for the mobile drawer.
 * Extracted here to keep AppLayout readable while sharing
 * the same visual structure as the desktop Sidebar.
 */
function MobileSidebarContent() {
  // We import and render Sidebar's internals inline here so the mobile
  // drawer has the identical look. We re-use the Sidebar component
  // directly by rendering it without the `hidden md:flex` wrapper.
  // However, since Sidebar applies `hidden md:flex`, we override via
  // a wrapper that forces display.
  return (
    <div className="[&>aside]:!flex [&>aside]:!relative [&>aside]:!w-full [&>aside]:!h-full">
      <Sidebar />
    </div>
  )
}
