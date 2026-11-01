import { useEffect } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { fetchPlatformConfig } from '@/lib/platformApi'
import { subscribeConfig } from '@/lib/configBus'
import { supabase } from '@/lib/supabase'
import { currentUserId } from '@/lib/mockData'
import { useConfigStore } from '@/store/useConfigStore'
import { useAppStore } from '@/store/useAppStore'

const CONFIG_TABLES = [
  'subscription_plans',
  'app_feature_flags',
  'exhaust_sounds',
  'sponsored_campaigns',
]

/**
 * Mounted once at the app shell. Pulls the cloud config, listens for admin
 * changes over BroadcastChannel + Supabase Realtime, and applies the current
 * rider's entitlement override.
 */
export const useConfigSync = () => {
  const applySnapshot = useConfigStore((state) => state.applySnapshot)
  const override = useConfigStore((state) => state.overrides[currentUserId])
  const plans = useConfigStore((state) => state.plans)

  useEffect(() => {
    let cancelled = false

    const pull = async () => {
      if (!supabase) return
      const snapshot = await fetchPlatformConfig()
      if (!cancelled && snapshot) applySnapshot(snapshot, undefined, 'supabase')
    }

    void pull()

    const unsubscribe = subscribeConfig(({ snapshot, overrides }) => {
      applySnapshot(snapshot, overrides, 'supabase')
    })

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'kixup.config.v1') void useConfigStore.persist.rehydrate()
    }
    window.addEventListener('storage', onStorage)

    let channel: RealtimeChannel | null = null
    if (supabase) {
      channel = supabase.channel('kixup-config-realtime')
      for (const table of CONFIG_TABLES) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            void pull()
          },
        )
      }
      channel.subscribe()
    }

    const onOnline = () => void pull()
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      unsubscribe()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('online', onOnline)
      if (channel && supabase) void supabase.removeChannel(channel)
    }
  }, [applySnapshot])

  useEffect(() => {
    if (!override) return

    const plan = override.planId
      ? plans.find((item) => item.id === override.planId)
      : undefined
    const isPro =
      override.isPro ?? (plan ? plan.priceInr > 0 || plan.priceUsd > 0 : false)
    const app = useAppStore.getState()
    const nextPlanId = plan?.id ?? app.planId
    const nextBadge = plan?.badgeType ?? app.planBadge

    if (
      app.isPro !== isPro ||
      app.planId !== nextPlanId ||
      app.planBadge !== nextBadge
    ) {
      app.applyEntitlement(nextPlanId, nextBadge, isPro)
    }
  }, [override, plans])
}
