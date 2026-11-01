import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AccountStatus, AdminRole, Profile } from '@/types'
import { supabase } from '@/lib/supabase'
import { currentUserId, profiles as mockProfiles } from '@/lib/mockData'
import { useConfigStore } from '@/store/useConfigStore'

type Row = Record<string, unknown>

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback

const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const asRole = (value: unknown): AdminRole =>
  value === 'road_captain' || value === 'club_admin' || value === 'super_admin'
    ? value
    : 'rider'

const asStatus = (value: unknown): AccountStatus =>
  value === 'suspended' || value === 'banned' ? value : 'active'

const mapProfile = (row: Row): Profile => ({
  id: str(row.id),
  handle: str(row.handle, 'rider'),
  fullName: str(row.full_name, str(row.handle, 'Rider')),
  city: str(row.city, 'Unknown'),
  country: str(row.country, 'IN'),
  primaryBike: str(row.primary_bike, 'Motorcycle'),
  bio: str(row.bio),
  isPro: Boolean(row.is_pro),
  totalKm: num(row.total_km),
  followers: num(row.followers),
  following: num(row.following),
  accent: str(row.accent, '#F43F5E'),
  avatarSeed: str(row.avatar_seed, 'rider'),
  ridingNow: Boolean(row.riding_now),
  role: asRole(row.role),
  status: asStatus(row.status),
  subscriptionPlanId: str(row.subscription_plan_id) || undefined,
  selectedExhaustSound: str(row.selected_exhaust_sound) || undefined,
  phone: str(row.phone) || undefined,
  lastActiveAt: str(row.last_active_at) || undefined,
})

const fetchAdminProfiles = async (): Promise<Profile[]> => {
  const client = supabase
  if (!client) return mockProfiles

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (!error && data?.length) return (data as Row[]).map(mapProfile)
  } catch {
    /* fall back to the seeded directory */
  }

  return mockProfiles
}

export const useAdminProfiles = () =>
  useQuery({
    queryKey: ['admin-profiles'],
    queryFn: fetchAdminProfiles,
    staleTime: 30_000,
  })

export interface AdminUser extends Profile {
  planId: string
  role: AdminRole
  status: AccountStatus
  lastActiveAt: string
}

export const useAdminUsers = (): AdminUser[] => {
  const { data } = useAdminProfiles()
  const overrides = useConfigStore((state) => state.overrides)

  return useMemo(() => {
    const source = data ?? mockProfiles
    return source.map((profile) => {
      const override = overrides[profile.id]
      const planId =
        override?.planId ??
        profile.subscriptionPlanId ??
        (profile.isPro ? 'plan_pro' : 'plan_free')
      const isPro =
        override?.isPro ?? (planId !== 'plan_free' ? true : profile.isPro)

      return {
        ...profile,
        planId,
        isPro,
        role:
          override?.role ??
          profile.role ??
          (profile.id === currentUserId ? 'super_admin' : 'rider'),
        status: override?.status ?? profile.status ?? 'active',
        lastActiveAt: profile.lastActiveAt ?? new Date().toISOString(),
      }
    })
  }, [data, overrides])
}
