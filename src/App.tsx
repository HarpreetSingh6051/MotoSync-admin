import { useState, useEffect } from 'react'
import { AdminPage } from './pages/AdminPage'
import { ToastHost } from './components/ToastHost'
import { useConfigSync } from './hooks/useConfigSync'

export const App = () => {
  useConfigSync()
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    fetch(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') + '/api/v1/health' || 'http://localhost:4000/api/v1/health')
      .then(res => res.json())
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'))
  }, [])

  return (
    <>
      <AdminPage />
      <ToastHost />
    </>
  )
}
