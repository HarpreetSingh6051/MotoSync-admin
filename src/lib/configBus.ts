import type { PlatformSnapshot, UserOverride } from '@/types'

/**
 * Cross-tab live sync for the Super Admin ERP and the rider app.
 *
 * BroadcastChannel is the fast path. The localStorage write is both a fallback
 * for browsers without BroadcastChannel and a signal for Zustand rehydration.
 */
const CHANNEL_NAME = 'kixup-config-v1'
const STORAGE_KEY = 'kixup.config.bus.v1'

const tabId = Math.random().toString(36).slice(2, 10)

export interface ConfigBroadcast {
  snapshot: PlatformSnapshot
  overrides: Record<string, UserOverride>
  source: string
  at: number
}

let channel: BroadcastChannel | null = null

const getChannel = () => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

export const broadcastConfig = (
  snapshot: PlatformSnapshot,
  overrides: Record<string, UserOverride>,
) => {
  const payload: ConfigBroadcast = {
    snapshot,
    overrides,
    source: tabId,
    at: Date.now(),
  }

  try {
    getChannel()?.postMessage(payload)
  } catch {
    /* channel can fail in private mode — localStorage still works */
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* storage quota / private mode */
  }
}

export const subscribeConfig = (
  callback: (payload: Pick<ConfigBroadcast, 'snapshot' | 'overrides'>) => void,
) => {
  const active = getChannel()

  const onMessage = (event: MessageEvent<ConfigBroadcast>) => {
    if (!event.data || event.data.source === tabId) return
    if (!event.data.snapshot || !event.data.overrides) return
    callback({ snapshot: event.data.snapshot, overrides: event.data.overrides })
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const payload = JSON.parse(event.newValue) as ConfigBroadcast
      if (payload.source === tabId || !payload.snapshot || !payload.overrides) return
      callback({ snapshot: payload.snapshot, overrides: payload.overrides })
    } catch {
      /* malformed payload */
    }
  }

  active?.addEventListener('message', onMessage)
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)

  return () => {
    active?.removeEventListener('message', onMessage)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}
