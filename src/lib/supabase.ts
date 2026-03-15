import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Detect if we have valid Supabase credentials
export const isDemoMode =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl === 'your_supabase_url' ||
  supabaseKey === 'your_supabase_anon_key' ||
  !supabaseUrl.startsWith('https://')

// Create the client — use a dummy URL in demo mode to prevent crash
export const supabase: SupabaseClient<Database> = createClient<Database>(
  isDemoMode ? 'https://placeholder.supabase.co' : supabaseUrl,
  isDemoMode ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' : supabaseKey,
  {
    auth: {
      autoRefreshToken: !isDemoMode,
      persistSession: !isDemoMode,
    },
  }
)

if (isDemoMode) {
  console.info(
    '%c🍁 MaplePath is running in DEMO MODE — no Supabase connection needed',
    'color: #C8102E; font-weight: bold; font-size: 14px;'
  )
}
