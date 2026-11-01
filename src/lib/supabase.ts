import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * The app runs in two modes:
 *  - `live`  → Supabase URL + anon key present, queries hit Postgres/PostGIS.
 *  - `demo`  → no keys yet, every query resolves against the seeded dataset in
 *              `src/lib/mockData.ts`. All writes stay local (and persist).
 *
 * This is intentional: the UI, the flows and the AI features are fully usable
 * before a single backend credential exists.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null

export const dataMode = isSupabaseConfigured ? 'live' : 'demo'

export const getAppUrl = () =>
  import.meta.env.VITE_APP_URL?.trim() || window.location.origin

export const publicMediaUrl = (path?: string | null) => {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  const base = import.meta.env.VITE_R2_PUBLIC_BASE_URL?.trim()
  return base ? `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : path
}
