import { useEffect, useState } from 'react'

export type RouteName =
  | 'feed'
  | 'ride'
  | 'live'
  | 'clubs'
  | 'chat'
  | 'create'
  | 'garage'
  | 'admin'
  | 'notfound'

export interface RouteMatch {
  name: RouteName
  path: string
  rideId?: string
  channelId?: string
  familyView?: boolean
}

const parse = (rawHash: string): RouteMatch => {
  const hash = rawHash.replace(/^#/, '') || '/feed'
  const [pathname, search = ''] = hash.split('?')
  const segments = pathname.split('/').filter(Boolean)
  const familyView = new URLSearchParams(search).get('family') === '1'

  if (segments.length === 0) return { name: 'feed', path: '/feed' }

  switch (segments[0]) {
    case 'feed':
      return { name: 'feed', path: pathname }
    case 'ride': {
      const rideId = segments[1]
      if (!rideId) return { name: 'feed', path: '/feed' }
      if (segments[2] === 'live') {
        return { name: 'live', path: pathname, rideId, familyView }
      }
      return { name: 'ride', path: pathname, rideId }
    }
    case 'clubs':
      return { name: 'clubs', path: pathname }
    case 'chat':
      return { name: 'chat', path: pathname, channelId: segments[1] }
    case 'create':
      return { name: 'create', path: pathname }
    case 'garage':
      return { name: 'garage', path: pathname }
    case 'admin':
      return { name: 'admin', path: '/admin' }
    default:
      return { name: 'notfound', path: pathname }
  }
}

/**
 * Production share links use `/r/:id` and `/live/:id` (with SPA rewrites).
 * Convert them to the hash router on first load, preserving `?family=1`.
 */
const cleanPathToHash = () => {
  if (typeof window === 'undefined') return ''
  const { pathname, search, hash } = window.location

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return '#/admin'

  const ride = pathname.match(/^\/r\/([^/]+)\/?$/)
  if (ride) return `#/ride/${ride[1]}${search}`

  const live = pathname.match(/^\/live\/([^/]+)\/?$/)
  if (live) return `#/ride/${live[1]}/live${search}`

  return hash
}

export const useRoute = () => {
  const [route, setRoute] = useState<RouteMatch>(() => parse(cleanPathToHash()))

  useEffect(() => {
    if (!window.location.hash) {
      const normalized = cleanPathToHash()
      if (normalized) window.history.replaceState(null, '', `/${normalized}`)
    }

    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export const navigate = (path: string) => {
  const target = path.startsWith('/') ? path : `/${path}`
  if (`#${target}` === window.location.hash) return
  window.location.hash = target
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export const goBack = () => {
  if (window.history.length > 1) window.history.back()
  else navigate('/feed')
}

export const ridePath = (id: string) => `/ride/${id}`
export const liveRidePath = (id: string) => `/ride/${id}/live`
export const chatPath = (id?: string) => (id ? `/chat/${id}` : '/chat')
export const adminPath = '/admin'
