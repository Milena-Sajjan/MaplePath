import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, ChevronRight, ChevronLeft,
  GraduationCap, Users, Plane, Shield, Globe, Languages, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfileStore } from '../../store/profileStore'
import { isDemoMode } from '../../lib/supabase'

const countries = [
  'India', 'China', 'Philippines', 'Nigeria', 'Pakistan', 'Iran', 'Brazil',
  'South Korea', 'France', 'Mexico', 'Colombia', 'Vietnam', 'Bangladesh',
  'Egypt', 'Turkey', 'Morocco', 'Algeria', 'Sri Lanka', 'Nepal', 'Ukraine',
  'United Kingdom', 'United States', 'Germany', 'Japan', 'Saudi Arabia',
  'United Arab Emirates', 'Kenya', 'Ghana', 'Ethiopia', 'South Africa',
  'Indonesia', 'Malaysia', 'Thailand', 'Lebanon', 'Syria', 'Iraq', 'Jordan',
  'Afghanistan', 'Somalia', 'Sudan', 'Haiti', 'Jamaica', 'Trinidad and Tobago',
  'Guyana', 'Other',
]

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'es', label: 'Spanish' },
  { code: 'ko', label: 'Korean' },
  { code: 'fa', label: 'Farsi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'bn', label: 'Bengali' },
]

const statusTypes = [
  {
    value: 'international_student',
    label: 'International Student',
    desc: 'Studying at a Canadian institution on a study permit',
    icon: GraduationCap,
    color: 'border-purple-400 bg-purple-50 text-purple-700',
    activeColor: 'border-purple-500 bg-purple-100 ring-2 ring-purple-300',
  },
  {
    value: 'permanent_resident',
    label: 'Permanent Resident',
    desc: 'Landed immigrant with PR card or confirmation',
    icon: Users,
    color: 'border-green-400 bg-green-50 text-green-700',
    activeColor: 'border-green-500 bg-green-100 ring-2 ring-green-300',
  },
  {
    value: 'visitor',
    label: 'Visitor',
    desc: 'On a visitor visa or exploring options in Canada',
    icon: Plane,
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
  },
  {
    value: 'refugee',
    label: 'Refugee / Protected Person',
    desc: 'Seeking asylum or granted refugee protection',
    icon: Shield,
    color: 'border-amber-400 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300',
  },
]

const accountSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type AccountForm = z.infer<typeof accountSchema>

export default function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const { update } = useProfileStore()

  const [step, setStep] = useState(1) // 1: screening, 2: account creation
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Screening state
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [countrySearch, setCountrySearch] = useState('')
  const [screeningError, setScreeningError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
  })

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const handleScreeningNext = () => {
    setScreeningError(null)
    if (!selectedStatus) {
      setScreeningError('Please select your immigration status')
      return
    }
    if (!selectedCountry) {
      setScreeningError('Please select your country of origin')
      return
    }
    setStep(2)
  }

  const onSubmit = async (data: AccountForm) => {
    setError(null)
    setLoading(true)
    try {
      await signUp(data.email, data.password)

      // Save screening data to profile store for onboarding
      if (isDemoMode) {
        const { useProfileStore: ps } = await import('../../store/profileStore')
        const profileState = ps.getState()
        profileState.setProfile({
          ...profileState.profile,
          status_type: selectedStatus as any,
          country_of_origin: selectedCountry,
          preferred_language: selectedLanguage,
        } as any)
      }

      // Store screening data in localStorage so onboarding can pick it up
      localStorage.setItem(
        'maplepath_screening',
        JSON.stringify({
          status_type: selectedStatus,
          country_of_origin: selectedCountry,
          preferred_language: selectedLanguage,
        })
      )

      navigate('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!selectedStatus) {
      setStep(1)
      setScreeningError('Please complete the screening first')
      return
    }
    localStorage.setItem(
      'maplepath_screening',
      JSON.stringify({
        status_type: selectedStatus,
        country_of_origin: selectedCountry,
        preferred_language: selectedLanguage,
      })
    )
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
  }

  const handleDemoExplore = () => {
    localStorage.setItem(
      'maplepath_screening',
      JSON.stringify({
        status_type: selectedStatus || 'international_student',
        country_of_origin: selectedCountry || 'India',
        preferred_language: selectedLanguage || 'en',
      })
    )
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-snow flex">
      {/* Left branding panel */}
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
          <p className="text-lg text-white/80 mb-6">{t('app.tagline')}</p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">1</div>
              <span className={step >= 1 ? 'text-white font-medium' : ''}>Tell us about yourself</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">2</div>
              <span className={step >= 2 ? 'text-white font-medium' : ''}>Create your account</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">3</div>
              <span>Your personalized roadmap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg viewBox="0 0 100 100" fill="#C8102E" className="w-8 h-8">
                <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
              </svg>
              <h1 className="font-serif text-3xl text-forest">MaplePath</h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-maple' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-maple' : 'bg-gray-200'}`} />
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: SCREENING ─────────────────────── */}
            {step === 1 && (
              <motion.div
                key="screening"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-semibold text-slate mb-1">Welcome to MaplePath 🍁</h2>
                <p className="text-gray-500 mb-6">Tell us a bit about yourself so we can personalize your experience</p>

                {screeningError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {screeningError}
                  </div>
                )}

                {/* Immigration Status */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate mb-3">
                    What is your immigration status in Canada?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {statusTypes.map((st) => {
                      const Icon = st.icon
                      const isActive = selectedStatus === st.value
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setSelectedStatus(st.value)}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            isActive ? st.activeColor : st.color
                          } hover:shadow-md`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-5 h-5" />
                            <span className="font-semibold text-sm">{st.label}</span>
                          </div>
                          <p className="text-xs opacity-70">{st.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Country of Origin */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate mb-2">
                    <Globe className="inline w-4 h-4 mr-1 -mt-0.5" />
                    Where are you from?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => {
                        setCountrySearch(e.target.value)
                        setSelectedCountry('')
                      }}
                      placeholder="Search for your country..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none transition"
                    />
                    {selectedCountry && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">
                        ✓ {selectedCountry}
                      </span>
                    )}
                  </div>
                  {countrySearch && !selectedCountry && (
                    <div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                      {filteredCountries.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c)
                            setCountrySearch(c)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-maple/5 text-sm transition"
                        >
                          {c}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-400">No matches found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preferred Language */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate mb-2">
                    <Languages className="inline w-4 h-4 mr-1 -mt-0.5" />
                    Preferred language for MaplePath
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none transition bg-white"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Next button */}
                <button
                  onClick={handleScreeningNext}
                  className="w-full bg-maple hover:bg-maple-light text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Continue to Sign Up
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Demo mode explore button */}
                {isDemoMode && (
                  <button
                    onClick={handleDemoExplore}
                    className="w-full mt-3 border-2 border-forest text-forest font-medium py-3 rounded-lg transition hover:bg-forest hover:text-white flex items-center justify-center gap-2"
                  >
                    Explore Demo Without Account
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-maple font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: ACCOUNT CREATION ──────────────── */}
            {step === 2 && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-slate mb-4 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to screening
                </button>

                {/* Summary pill */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedStatus && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-forest-pale text-forest text-xs font-medium">
                      {statusTypes.find((s) => s.value === selectedStatus)?.label}
                    </span>
                  )}
                  {selectedCountry && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      {selectedCountry}
                    </span>
                  )}
                  {selectedLanguage && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                      <Languages className="w-3 h-3" />
                      {languages.find((l) => l.code === selectedLanguage)?.label}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-semibold text-slate mb-1">Create your account</h2>
                <p className="text-gray-500 mb-6">Start your settlement journey in Canada</p>

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
                        placeholder="At least 6 characters"
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

                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none transition"
                        placeholder="Confirm your password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input {...register('terms')} type="checkbox" className="mt-1 accent-maple" />
                    <span className="text-sm text-gray-600">{t('auth.termsAgree')}</span>
                  </label>
                  {errors.terms && <p className="text-red-500 text-xs">{errors.terms.message}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-maple hover:bg-maple-light text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : 'Create Account & Start Your Journey'}
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

                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-maple font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
