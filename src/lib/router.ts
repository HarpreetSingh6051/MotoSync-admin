export const navigate = (path: string) => {
  if (typeof window === 'undefined') return
  if (path.startsWith('/')) {
    const riderUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
    window.location.href = `${riderUrl}#${path}`
  } else {
    window.location.hash = path
  }
}
