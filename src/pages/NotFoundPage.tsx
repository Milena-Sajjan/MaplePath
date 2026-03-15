import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-snow flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <svg viewBox="0 0 100 100" fill="#C8102E" className="w-16 h-16 mx-auto mb-6 opacity-30">
          <path d="M50 5 L55 25 L70 15 L65 35 L85 30 L70 45 L90 50 L70 55 L85 70 L65 65 L70 85 L55 75 L50 95 L45 75 L30 85 L35 65 L15 70 L30 55 L10 50 L30 45 L15 30 L35 35 L30 15 L45 25 Z" />
        </svg>
        <h1 className="text-6xl font-serif text-forest mb-2">404</h1>
        <h2 className="text-xl font-medium text-slate mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Looks like you've wandered off the path. Let's get you back on track.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-forest text-white px-5 py-2.5 rounded-lg hover:bg-forest-mid transition font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-slate"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
