import { environment } from './environment'
export const navigate = (path: string) => {
  if (typeof window === 'undefined') return
  if (path.startsWith('/')) {
    const riderUrl = environment.riderUrl
    window.location.href = `${riderUrl}#${path}`
  } else {
    window.location.hash = path
  }
}
