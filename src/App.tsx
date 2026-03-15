import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useProfileStore } from './store/profileStore'

const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const SettlerWizPage = lazy(() => import('./pages/SettlerWizPage'))
const ForumPage = lazy(() => import('./pages/ForumPage'))
const ForumPostPage = lazy(() => import('./pages/ForumPostPage'))
const JobsPage = lazy(() => import('./pages/JobsPage'))
const HousingPage = lazy(() => import('./pages/HousingPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-snow">
      <div className="text-center">
        <svg viewBox="0 0 100 100" fill="#C8102E" className="w-12 h-12 mx-auto animate-pulse">
          <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
        </svg>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const { profile } = useProfileStore()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="wizard" element={<SettlerWizPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="forum/:id" element={<ForumPostPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="housing" element={<HousingPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
