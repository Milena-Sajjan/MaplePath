import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'

const canadianUniversities = [
  'Carleton University', 'University of Ottawa', 'University of Toronto',
  'McGill University', 'University of British Columbia', 'University of Waterloo',
  'University of Alberta', 'McMaster University', 'Western University',
  'Queen\'s University', 'York University', 'University of Calgary',
  'Simon Fraser University', 'Dalhousie University', 'University of Manitoba',
  'Ryerson University', 'Concordia University', 'University of Victoria',
  'University of Saskatchewan', 'Algonquin College', 'Seneca College',
  'George Brown College', 'Humber College', 'Conestoga College',
  'Centennial College', 'BCIT', 'Other',
]

const cities = ['Ottawa', 'Toronto', 'Vancouver', 'Calgary', 'Montreal', 'Edmonton', 'Winnipeg', 'Halifax', 'Other']
const countries = [
  'India', 'China', 'Nigeria', 'Pakistan', 'Philippines', 'Iran', 'Bangladesh',
  'Brazil', 'Mexico', 'South Korea', 'Vietnam', 'Colombia', 'Turkey', 'Egypt',
  'Ukraine', 'Nepal', 'Sri Lanka', 'Kenya', 'Ghana', 'Japan', 'Other',
]
const languageOptions = [
  'English', 'French', 'Hindi', 'Mandarin', 'Arabic', 'Punjabi', 'Urdu',
  'Spanish', 'Portuguese', 'Korean', 'Vietnamese', 'Tagalog', 'Bengali',
  'Tamil', 'Telugu', 'Other',
]
const appLanguages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'zh', label: '\u4e2d\u6587' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
]

interface OnboardingData {
  fullName: string
  statusType: string
  university: string
  program: string
  arrivalDate: string
  city: string
  countryOfOrigin: string
  languages: string[]
  preferredLanguage: string
}

export default function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { fetchProfile } = useProfileStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [universitySearch, setUniversitySearch] = useState('')
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    statusType: '',
    university: '',
    program: '',
    arrivalDate: '',
    city: 'Ottawa',
    countryOfOrigin: '',
    languages: ['English'],
    preferredLanguage: 'en',
  })

  const update = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleLanguage = (lang: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  const filteredUniversities = canadianUniversities.filter((u) =>
    u.toLowerCase().includes(universitySearch.toLowerCase())
  )

  const canProceed = () => {
    switch (step) {
      case 1: return data.fullName.trim() !== '' && data.statusType !== ''
      case 2: return data.city !== ''
      case 3: return data.countryOfOrigin !== '' && data.languages.length > 0
      case 4: return true
      default: return false
    }
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: data.fullName,
        status_type: data.statusType as any,
        university: data.university || null,
        program: data.program || null,
        arrival_date: data.arrivalDate || null,
        city: data.city,
        province: data.city === 'Montreal' ? 'Quebec' : data.city === 'Vancouver' ? 'British Columbia' : data.city === 'Calgary' || data.city === 'Edmonton' ? 'Alberta' : data.city === 'Winnipeg' ? 'Manitoba' : data.city === 'Halifax' ? 'Nova Scotia' : 'Ontario',
        country_of_origin: data.countryOfOrigin,
        languages: data.languages,
        preferred_language: data.preferredLanguage,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      i18n.changeLanguage(data.preferredLanguage)
      if (data.preferredLanguage === 'ar') {
        document.documentElement.dir = 'rtl'
      } else {
        document.documentElement.dir = 'ltr'
      }

      await fetchProfile(user.id)

      try {
        await supabase.functions.invoke('sendWelcomeEmail', {
          body: {
            email: user.email,
            name: data.fullName,
            status_type: data.statusType,
            city: data.city,
            nextSteps: ['Get your SIN number', 'Open a bank account', 'Get a Canadian SIM card'],
          },
        })
      } catch {
        // Welcome email is non-critical
      }

      navigate('/')
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-snow flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg viewBox="0 0 100 100" fill="#C8102E" className="w-8 h-8">
              <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
            </svg>
            <h1 className="font-serif text-3xl text-forest">MaplePath</h1>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s < step
                      ? 'bg-forest text-white'
                      : s === step
                      ? 'bg-maple text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-0.5 ${s < step ? 'bg-forest' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate">{t('onboarding.welcome')}</h2>
                    <p className="text-gray-500 mt-1">{t('onboarding.step1Title')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.fullName')}</label>
                    <input
                      value={data.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.statusType')}</label>
                    <select
                      value={data.statusType}
                      onChange={(e) => update('statusType', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
                    >
                      <option value="">Select your status</option>
                      <option value="international_student">{t('status.international_student')}</option>
                      <option value="permanent_resident">{t('status.permanent_resident')}</option>
                      <option value="visitor">{t('status.visitor')}</option>
                      <option value="refugee">{t('status.refugee')}</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate">{t('onboarding.step2Title')}</h2>
                  </div>
                  {(data.statusType === 'international_student') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.university')}</label>
                        <input
                          value={universitySearch || data.university}
                          onChange={(e) => {
                            setUniversitySearch(e.target.value)
                            update('university', e.target.value)
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                          placeholder="Start typing..."
                        />
                        {universitySearch && filteredUniversities.length > 0 && (
                          <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                            {filteredUniversities.slice(0, 8).map((uni) => (
                              <button
                                key={uni}
                                onClick={() => {
                                  update('university', uni)
                                  setUniversitySearch('')
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                              >
                                {uni}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.program')}</label>
                        <input
                          value={data.program}
                          onChange={(e) => update('program', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.arrivalDate')}</label>
                    <input
                      type="date"
                      value={data.arrivalDate}
                      onChange={(e) => update('arrivalDate', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.city')}</label>
                    <select
                      value={data.city}
                      onChange={(e) => update('city', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
                    >
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate">{t('onboarding.step3Title')}</h2>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.countryOfOrigin')}</label>
                    <select
                      value={data.countryOfOrigin}
                      onChange={(e) => update('countryOfOrigin', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
                    >
                      <option value="">Select your country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-2">{t('onboarding.languages')}</label>
                    <div className="flex flex-wrap gap-2">
                      {languageOptions.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            data.languages.includes(lang)
                              ? 'bg-forest text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate mb-1">{t('onboarding.preferredLanguage')}</label>
                    <select
                      value={data.preferredLanguage}
                      onChange={(e) => update('preferredLanguage', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
                    >
                      {appLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate">{t('onboarding.step4Title')}</h2>
                  </div>
                  <div className="bg-forest-pale rounded-xl p-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium text-slate">{data.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-slate">{t(`status.${data.statusType}`)}</span>
                    </div>
                    {data.university && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">University</span>
                        <span className="font-medium text-slate">{data.university}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">City</span>
                      <span className="font-medium text-slate">{data.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From</span>
                      <span className="font-medium text-slate">{data.countryOfOrigin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Languages</span>
                      <span className="font-medium text-slate">{data.languages.join(', ')}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-forest font-medium">{t('onboarding.profileReady')}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-slate transition"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('onboarding.back')}
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => canProceed() && setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1 px-6 py-2.5 bg-maple text-white rounded-lg hover:bg-maple-light transition disabled:opacity-50 font-medium"
              >
                {t('onboarding.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-forest text-white rounded-lg hover:bg-forest-mid transition disabled:opacity-50 font-medium"
              >
                {saving ? t('common.loading') : t('onboarding.goToDashboard')}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
