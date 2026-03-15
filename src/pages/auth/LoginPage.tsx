import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
  }

  return (
    <div className="min-h-screen bg-snow flex">
      <div className="hidden lg:flex lg:w-1/2 bg-forest items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <svg
              key={i}
              className="absolute text-white"
              style={{
                left: `${(i * 17 + 5) % 100}%`,
                top: `${(i * 23 + 10) % 100}%`,
                width: `${30 + (i % 5) * 10}px`,
                opacity: 0.3 + (i % 4) * 0.1,
                transform: `rotate(${i * 37}deg)`,
              }}
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
            </svg>
          ))}
        </div>
        <div className="relative z-10 text-center text-white px-12">
          <h1 className="font-serif text-5xl mb-4">MaplePath</h1>
          <p className="text-lg text-white/80">{t('app.tagline')}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg viewBox="0 0 100 100" fill="#C8102E" className="w-8 h-8">
                <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
              </svg>
              <h1 className="font-serif text-3xl text-forest">MaplePath</h1>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate mb-1">{t('auth.welcomeBack')}</h2>
          <p className="text-gray-500 mb-8">Sign in to continue your settlement journey</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate mb-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maple hover:bg-maple-light text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-snow px-2 text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 hover:bg-gray-50 transition font-medium text-slate"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          <div className="mt-6 p-4 bg-forest-pale border border-forest/20 rounded-xl text-center">
            <p className="text-sm text-forest font-medium mb-2">New to Canada? 🍁</p>
            <p className="text-xs text-gray-600 mb-3">
              Sign up to get a personalized settlement roadmap based on your immigration status
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1 bg-forest text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-forest-mid transition"
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
