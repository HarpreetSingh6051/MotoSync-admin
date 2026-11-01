import type { PingType, RideStatus } from '@/types'

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const initials = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const hashCode = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const fromNow = (ms: number) => new Date(Date.now() + ms).toISOString()

export const minutesFromNow = (minutes: number) => fromNow(minutes * MINUTE)
export const hoursFromNow = (hours: number) => fromNow(hours * HOUR)
export const daysFromNow = (days: number) => fromNow(days * DAY)

export const relativeTime = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? '' : ' ago'
  const prefix = diff >= 0 ? 'in ' : ''

  if (abs < MINUTE) return diff >= 0 ? 'now' : 'just now'
  if (abs < HOUR) return `${prefix}${Math.round(abs / MINUTE)}m${suffix}`
  if (abs < DAY) return `${prefix}${Math.round(abs / HOUR)}h${suffix}`
  if (abs < 7 * DAY) return `${prefix}${Math.round(abs / DAY)}d${suffix}`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

export const dayLabel = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(Date.now() + DAY)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(date, today)) return 'Today'
  if (same(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const meetupLabel = (iso: string) => `${dayLabel(iso)} · ${clockTime(iso)}`

export const currencySymbol = (currency: string) => (currency === 'USD' ? '$' : '₹')

export const money = (amount: number, currency = 'INR') => {
  const symbol = currencySymbol(currency)
  const rounded = Math.round(amount * 100) / 100
  return `${symbol}${rounded.toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN', {
    maximumFractionDigits: 2,
  })}`
}

export const compact = (value: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const statusLabel = (status: RideStatus) =>
  status === 'ongoing' ? 'Live now' : status === 'upcoming' ? 'Upcoming' : 'Completed'

export const pingMeta: Record<PingType, { emoji: string; label: string; tone: string }> = {
  'FUEL STOP': { emoji: '⛽', label: 'Fuel stop', tone: 'text-amber-300' },
  'CHAI BREAK': { emoji: '☕', label: 'Chai break', tone: 'text-orange-300' },
  HAZARD: { emoji: '🚨', label: 'Hazard / stop', tone: 'text-rose-300' },
  'ALL CLEAR': { emoji: '⚡', label: 'All clear', tone: 'text-emerald-300' },
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}

/** Interpolates a latitude/longitude along a two-point leg (good enough for radar demo). */
export const interpolate = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number,
) => ({
  lat: from.lat + (to.lat - from.lat) * t,
  lng: from.lng + (to.lng - from.lng) * t,
})

/** Great-circle distance in km. */
export const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
