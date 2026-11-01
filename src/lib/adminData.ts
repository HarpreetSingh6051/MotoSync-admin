import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AccountStatus, AdminRole, Club, Profile, Region } from '@/types'
import { supabase } from '@/lib/supabase'
import { currentUserId, profiles as mockProfiles } from '@/lib/mockData'
import { useConfigStore } from '@/store/useConfigStore'

type Row = Record<string, unknown>

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://moto-sync-be.vercel.app/api/v1').replace(/\/$/, '')

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
  fullName: str(row.full_name || row.fullName, str(row.handle, 'Rider')),
  city: str(row.city, 'Unknown'),
  country: str(row.country, 'IN'),
  primaryBike: str(row.primary_bike || row.primaryBike, 'Motorcycle'),
  bio: str(row.bio),
  isPro: Boolean(row.is_pro ?? row.isPro),
  totalKm: num(row.total_km ?? row.totalKm),
  followers: num(row.followers ?? row.followers_count),
  following: num(row.following ?? row.following_count),
  accent: str(row.accent, '#F43F5E'),
  avatarSeed: str(row.avatar_seed || row.avatarSeed, 'rider'),
  ridingNow: Boolean(row.riding_now ?? row.ridingNow),
  role: asRole(row.role),
  status: asStatus(row.status),
  subscriptionPlanId: str(row.subscription_plan_id || row.subscriptionPlanId) || undefined,
  selectedExhaustSound: str(row.selected_exhaust_sound || row.selectedExhaustSound) || undefined,
  phone: str(row.phone) || undefined,
  lastActiveAt: str(row.last_active_at || row.lastActiveAt) || undefined,
})

const fetchAdminProfiles = async (): Promise<Profile[]> => {
  try {
    const res = await fetch(`${API_BASE}/users`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return (data as Row[]).map(mapProfile)
      }
    }
  } catch {
    /* fallback to Supabase */
  }

  const client = supabase
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })
      if (!error && data?.length) return (data as Row[]).map(mapProfile)
    } catch {
      /* fall back to the seeded directory */
    }
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
  registeredAt: string
}

export const useAdminUsers = (): AdminUser[] => {
  const { data } = useAdminProfiles()
  const overrides = useConfigStore((state) => state.overrides)

  return useMemo(() => {
    const source = data ?? mockProfiles
    return source.map((profile, idx) => {
      const override = overrides[profile.id]
      const planId =
        override?.planId ??
        profile.subscriptionPlanId ??
        (profile.isPro ? 'plan_pro' : 'plan_free')
      const isPro =
        override?.isPro ?? (planId !== 'plan_free' ? true : profile.isPro)

      // Stable registration dates for mock data
      const regDates = [
        '2026-02-14',
        '2026-03-22',
        '2026-05-10',
        '2026-06-18',
        '2026-08-04',
        '2026-09-12',
      ]

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
        registeredAt: regDates[idx % regDates.length] || '2026-01-15',
      }
    })
  }, [data, overrides])
}

/* ------------------------------------------------------------------ */
/* Ride Groups / Clubs Data Hook                                       */
/* ------------------------------------------------------------------ */

export const mockClubs: Club[] = [
  {
    id: 'c_phog',
    name: 'Punjab Harley Owners',
    handle: 'phog',
    description: 'The original NH-44 Sunday pack. Cruisers, touring rigs and the best post-ride parathas in Punjab.',
    city: 'Ludhiana',
    region: 'India',
    ridingStyle: 'Cruisers & Touring',
    badgeEmoji: '🦅',
    privacy: 'public',
    verified: true,
    memberCount: 412,
    ridingNow: 34,
    accent: '#F43F5E',
    createdBy: 'u_arjun',
    memberIds: ['u_arjun', 'u_simran', 'u_kabir', 'u_dev'],
    founded: '2019',
  },
  {
    id: 'c_bangalore_dawn',
    name: 'Bangalore Dawn Patrol',
    handle: 'dawnbangalore',
    description: 'Early morning mountain and trail runs up Nandi Hills and Kanakapura. ADVs and dual-sports preferred.',
    city: 'Bengaluru',
    region: 'India',
    ridingStyle: 'Adventure & Dual-Sport',
    badgeEmoji: '⚡',
    privacy: 'public',
    verified: true,
    memberCount: 298,
    ridingNow: 18,
    accent: '#22D3EE',
    createdBy: 'u_ananya',
    memberIds: ['u_ananya'],
    founded: '2021',
  },
  {
    id: 'c_delhi_caferacers',
    name: 'Delhi Cafe Racers',
    handle: 'dcr_delhi',
    description: 'Classic thumpers, retro roadsters, and sunrise breakfast sprints across Gurgaon-Faridabad expressway.',
    city: 'New Delhi',
    region: 'India',
    ridingStyle: 'Cafe Racers & Classics',
    badgeEmoji: '☕',
    privacy: 'public',
    verified: false,
    memberCount: 514,
    ridingNow: 42,
    accent: '#FBBF24',
    createdBy: 'u_dev',
    memberIds: ['u_dev'],
    founded: '2020',
  },
  {
    id: 'c_mumbai_coastal',
    name: 'Mumbai Coastal Cruisers',
    handle: 'mumbaicoastal',
    description: 'Night rides along Marine Drive and spirited Sunday runs through the Western Ghats to Lonavala.',
    city: 'Mumbai',
    region: 'India',
    ridingStyle: 'Coastal & Highway Cruising',
    badgeEmoji: '🌊',
    privacy: 'invite_only',
    verified: true,
    memberCount: 380,
    ridingNow: 12,
    accent: '#10B981',
    createdBy: 'u_simran',
    memberIds: ['u_simran'],
    founded: '2022',
  },
]

export const mapClubRow = (row: Row): Club => ({
  id: str(row.id),
  name: str(row.name, 'Untitled Club'),
  handle: str(row.handle, 'club'),
  description: str(row.description, ''),
  city: str(row.city, 'Unknown'),
  region: (str(row.region) === 'Global' ? 'Global' : 'India') as Region,
  ridingStyle: str(row.riding_style || row.ridingStyle, 'Cruisers & Touring'),
  badgeEmoji: str(row.badge_emoji || row.badgeEmoji, '🏍️'),
  privacy: (str(row.privacy) === 'invite_only' ? 'invite_only' : 'public') as 'public' | 'invite_only',
  verified: Boolean(row.verified),
  memberCount: num(row.member_count || row.memberCount, 1),
  ridingNow: num(row.riding_now || row.ridingNow, 0),
  accent: str(row.accent, '#F43F5E'),
  createdBy: str(row.created_by || row.createdBy, 'u_arjun'),
  memberIds: Array.isArray(row.member_ids || row.memberIds) ? (row.member_ids || row.memberIds) as string[] : [],
  founded: str(row.founded, '2022'),
})

export const fetchAdminClubs = async (): Promise<Club[]> => {
  try {
    const res = await fetch(`${API_BASE}/clubs`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return (data as Row[]).map(mapClubRow)
      }
    }
  } catch {
    /* fallback to Supabase */
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('member_count', { ascending: false })
      if (!error && data?.length) return (data as Row[]).map(mapClubRow)
    } catch {
      /* fallback */
    }
  }

  return mockClubs
}

export const useAdminClubs = (): Club[] => {
  const { data } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: fetchAdminClubs,
    staleTime: 30_000,
  })
  return data ?? mockClubs
}

export const updateClubVerification = async (clubId: string, verified: boolean) => {
  try {
    await fetch(`${API_BASE}/clubs/${clubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    })
  } catch {}
  if (supabase) {
    try {
      await supabase.from('clubs').update({ verified }).eq('id', clubId)
    } catch {}
  }
}

/* ------------------------------------------------------------------ */
/* Subscription Purchases / Transactions Data Hook                     */
/* ------------------------------------------------------------------ */

export interface SubscriptionPurchase {
  id: string
  transactionId: string
  riderId: string
  riderName: string
  riderHandle: string
  planId: string
  planName: string
  amountInr: number
  amountUsd: number
  billingInterval: 'monthly' | 'annual'
  purchasedAt: string
  paymentMethod: 'UPI / Razorpay' | 'Credit Card / Stripe' | 'Apple Pay'
  status: 'paid' | 'renewed' | 'pending'
}

export const fetchAdminPurchases = async (): Promise<SubscriptionPurchase[]> => {
  try {
    const res = await fetch(`${API_BASE}/reports/purchases`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data as SubscriptionPurchase[]
      }
    }
  } catch {}

  return mockPurchases
}

export const useAdminPurchases = (): SubscriptionPurchase[] => {
  const { data } = useQuery({
    queryKey: ['admin-purchases'],
    queryFn: fetchAdminPurchases,
    staleTime: 30_000,
  })
  return data ?? mockPurchases
}

export const mockPurchases: SubscriptionPurchase[] = [
  {
    id: 'tx_9921',
    transactionId: 'PAY-MS-2026-9021',
    riderId: 'u_arjun',
    riderName: 'Arjun Singh',
    riderHandle: 'rajasingh',
    planId: 'plan_pro',
    planName: 'Road Captain PRO',
    amountInr: 199,
    amountUsd: 4.99,
    billingInterval: 'monthly',
    purchasedAt: '2026-10-28 09:14 AM',
    paymentMethod: 'UPI / Razorpay',
    status: 'paid',
  },
  {
    id: 'tx_9922',
    transactionId: 'PAY-MS-2026-8874',
    riderId: 'u_simran',
    riderName: 'Simran Kaur',
    riderHandle: 'simranrides',
    planId: 'plan_pro',
    planName: 'Road Captain PRO',
    amountInr: 199,
    amountUsd: 4.99,
    billingInterval: 'monthly',
    purchasedAt: '2026-10-27 06:45 PM',
    paymentMethod: 'Apple Pay',
    status: 'paid',
  },
  {
    id: 'tx_9923',
    transactionId: 'PAY-MS-2026-8432',
    riderId: 'u_ananya',
    riderName: 'Ananya Rao',
    riderHandle: 'ananyarevs',
    planId: 'plan_silver',
    planName: 'Silver Visor',
    amountInr: 99,
    amountUsd: 1.99,
    billingInterval: 'monthly',
    purchasedAt: '2026-10-25 11:20 AM',
    paymentMethod: 'UPI / Razorpay',
    status: 'paid',
  },
  {
    id: 'tx_9924',
    transactionId: 'PAY-MS-2026-7811',
    riderId: 'u_phog_club',
    riderName: 'Punjab Harley Owners (Club)',
    riderHandle: 'phog',
    planId: 'plan_club',
    planName: 'Club Shield',
    amountInr: 4999,
    amountUsd: 59.0,
    billingInterval: 'monthly',
    purchasedAt: '2026-10-20 02:30 PM',
    paymentMethod: 'Credit Card / Stripe',
    status: 'renewed',
  },
  {
    id: 'tx_9925',
    transactionId: 'PAY-MS-2026-7104',
    riderId: 'u_taran',
    riderName: 'Taranjeet Singh',
    riderHandle: 'tarantwin',
    planId: 'plan_pro_annual',
    planName: 'Road Captain PRO Annual',
    amountInr: 1499,
    amountUsd: 39.99,
    billingInterval: 'annual',
    purchasedAt: '2026-10-18 04:12 PM',
    paymentMethod: 'UPI / Razorpay',
    status: 'paid',
  },
]


