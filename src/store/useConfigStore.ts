import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ExhaustSound,
  FeatureFlag,
  PlatformSnapshot,
  SponsoredCampaign,
  SubscriptionPlan,
  UserOverride,
} from '@/types'
import {
  defaultCampaigns,
  defaultFlags,
  defaultPlans,
  defaultSounds,
} from '@/lib/platformDefaults'
import { broadcastConfig } from '@/lib/configBus'

interface ConfigState extends PlatformSnapshot {
  overrides: Record<string, UserOverride>
  lastSyncedAt: string | null
  syncSource: 'demo' | 'supabase'

  applySnapshot: (
    snapshot: Partial<PlatformSnapshot>,
    overrides?: Record<string, UserOverride>,
    source?: 'demo' | 'supabase',
  ) => void

  upsertPlan: (plan: SubscriptionPlan) => void
  removePlan: (id: string) => void
  upsertFlag: (flag: FeatureFlag) => void
  removeFlag: (key: string) => void
  upsertSound: (sound: ExhaustSound) => void
  removeSound: (id: string) => void
  upsertCampaign: (campaign: SponsoredCampaign) => void
  removeCampaign: (id: string) => void

  setUserOverride: (userId: string, patch: UserOverride) => void
  clearUserOverride: (userId: string) => void
  resetConfig: () => void
}

const snapshotOf = (state: ConfigState): PlatformSnapshot => ({
  plans: state.plans,
  flags: state.flags,
  sounds: state.sounds,
  campaigns: state.campaigns,
})

const publish = (state: ConfigState) => broadcastConfig(snapshotOf(state), state.overrides)

const sortPlans = (plans: SubscriptionPlan[]) =>
  [...plans].sort((a, b) => a.sortOrder - b.sortOrder)

const sortSounds = (sounds: ExhaustSound[]) =>
  [...sounds].sort((a, b) => a.sortOrder - b.sortOrder)

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      plans: defaultPlans,
      flags: defaultFlags,
      sounds: defaultSounds,
      campaigns: defaultCampaigns,
      overrides: {},
      lastSyncedAt: null,
      syncSource: 'demo',

      applySnapshot: (snapshot, overrides, source = 'supabase') =>
        set((state) => ({
          plans: snapshot.plans ? sortPlans(snapshot.plans) : state.plans,
          flags: snapshot.flags ?? state.flags,
          sounds: snapshot.sounds ? sortSounds(snapshot.sounds) : state.sounds,
          campaigns: snapshot.campaigns ?? state.campaigns,
          overrides: overrides ?? state.overrides,
          lastSyncedAt: new Date().toISOString(),
          syncSource: source,
        })),

      upsertPlan: (plan) => {
        set((state) => ({
          plans: sortPlans([...state.plans.filter((item) => item.id !== plan.id), plan]),
        }))
        publish(get())
      },
      removePlan: (id) => {
        set((state) => ({ plans: state.plans.filter((item) => item.id !== id) }))
        publish(get())
      },

      upsertFlag: (flag) => {
        set((state) => ({
          flags: [...state.flags.filter((item) => item.key !== flag.key), flag],
        }))
        publish(get())
      },
      removeFlag: (key) => {
        set((state) => ({ flags: state.flags.filter((item) => item.key !== key) }))
        publish(get())
      },

      upsertSound: (sound) => {
        set((state) => ({
          sounds: sortSounds([...state.sounds.filter((item) => item.id !== sound.id), sound]),
        }))
        publish(get())
      },
      removeSound: (id) => {
        set((state) => ({ sounds: state.sounds.filter((item) => item.id !== id) }))
        publish(get())
      },

      upsertCampaign: (campaign) => {
        set((state) => ({
          campaigns: [
            ...state.campaigns.filter((item) => item.id !== campaign.id),
            campaign,
          ],
        }))
        publish(get())
      },
      removeCampaign: (id) => {
        set((state) => ({ campaigns: state.campaigns.filter((item) => item.id !== id) }))
        publish(get())
      },

      setUserOverride: (userId, patch) => {
        set((state) => ({
          overrides: {
            ...state.overrides,
            [userId]: { ...state.overrides[userId], ...patch },
          },
        }))
        publish(get())
      },
      clearUserOverride: (userId) => {
        set((state) => {
          const next = { ...state.overrides }
          delete next[userId]
          return { overrides: next }
        })
        publish(get())
      },

      resetConfig: () => {
        set({
          plans: defaultPlans,
          flags: defaultFlags,
          sounds: defaultSounds,
          campaigns: defaultCampaigns,
          overrides: {},
          lastSyncedAt: null,
          syncSource: 'demo',
        })
        publish(get())
      },
    }),
    {
      name: 'kixup.config.v1',
      partialize: (state) => ({
        plans: state.plans,
        flags: state.flags,
        sounds: state.sounds,
        campaigns: state.campaigns,
        overrides: state.overrides,
        lastSyncedAt: state.lastSyncedAt,
        syncSource: state.syncSource,
      }),
    },
  ),
)
