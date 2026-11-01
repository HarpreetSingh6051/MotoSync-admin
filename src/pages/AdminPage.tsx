import { useMemo, useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flag,
  Flame,
  Gauge,
  Headphones,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Mic,
  Moon,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Square,
  Sun,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar, Button, Modal, Panel, Pill, SectionHeading, Segmented, Toggle } from '@/components/ui'
import { GoldenHelmetBadge } from '@/components/brand/GoldenHelmetBadge'
import { Logo } from '@/components/ui'
import { ToastHost } from '@/components/ToastHost'
import { useAppStore } from '@/store/useAppStore'
import { useConfigStore } from '@/store/useConfigStore'
import { useAdminUsers, useAdminClubs, useAdminPurchases, updateClubVerification, type SubscriptionPurchase } from '@/lib/adminData'
import {
  fetchPlatformConfig,
  logAdminAction,
  removeCampaign,
  removeFlag,
  removePlan,
  removeSound,
  saveCampaign,
  saveFlag,
  savePlan,
  saveSound,
  updateUserAdmin,
} from '@/lib/platformApi'
import { dataMode, supabase } from '@/lib/supabase'
import { currentUserId } from '@/lib/mockData'
import { cx, money } from '@/lib/format'
import type {
  AccountStatus,
  AdminRole,
  Club,
  ExhaustSound,
  FeatureFlag,
  PlanAudience,
  PlanBadgeType,
  PlatformSnapshot,
  SponsoredCampaign,
  SubscriptionPlan,
} from '@/types'

export type NavModule =
  | 'overview'
  | 'users'
  | 'clubs'
  | 'plans'
  | 'reports'
  | 'flags'
  | 'sounds'
  | 'campaigns'
  | 'settings'

export type ThemeMode = 'system' | 'day' | 'night'

interface NavGroup {
  group: string
  items: Array<{
    id: NavModule
    label: string
    icon: typeof Activity
    badge?: string
  }>
}

const RIDER_APP_URL = import.meta.env.VITE_APP_URL || 'https://moto-sync-ochre.vercel.app'
const BACKEND_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://moto-sync-be.vercel.app/api/v1'

export const AdminPage = () => {
  const [currentModule, setCurrentModule] = useState<NavModule>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('motosync_theme') as ThemeMode) || 'night'
  })
  const [isLight, setIsLight] = useState(false)

  // Module filter & search states
  const [searchQuery, setSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [purchaseFilter, setPurchaseFilter] = useState<string>('all')
  const [pulling, setPulling] = useState(false)
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Intercom Bridge & Module controls state
  const [intercomCodec, setIntercomCodec] = useState<'opus_24k' | 'opus_48k_hd'>('opus_48k_hd')
  const [intercomMaxSpeakers, setIntercomMaxSpeakers] = useState<number>(8)
  const [radarThresholdKm, setRadarThresholdKm] = useState<number>(2.0)
  const [radarGpsInterval, setRadarGpsInterval] = useState<'1s' | '3s' | '5s'>('1s')

  const pushToast = useAppStore((state) => state.pushToast)
  const plans = useConfigStore((state) => state.plans)
  const flags = useConfigStore((state) => state.flags)
  const sounds = useConfigStore((state) => state.sounds)
  const campaigns = useConfigStore((state) => state.campaigns)
  const overrides = useConfigStore((state) => state.overrides)
  const lastSyncedAt = useConfigStore((state) => state.lastSyncedAt)
  const upsertPlan = useConfigStore((state) => state.upsertPlan)
  const removePlanAction = useConfigStore((state) => state.removePlan)
  const upsertFlag = useConfigStore((state) => state.upsertFlag)
  const removeFlagAction = useConfigStore((state) => state.removeFlag)
  const upsertSound = useConfigStore((state) => state.upsertSound)
  const removeSoundAction = useConfigStore((state) => state.removeSound)
  const upsertCampaign = useConfigStore((state) => state.upsertCampaign)
  const removeCampaignAction = useConfigStore((state) => state.removeCampaign)
  const setUserOverride = useConfigStore((state) => state.setUserOverride)
  const applySnapshot = useConfigStore((state) => state.applySnapshot)
  const resetConfig = useConfigStore((state) => state.resetConfig)

  const users = useAdminUsers()
  const clubs = useAdminClubs()
  const purchases = useAdminPurchases()

  const [planModal, setPlanModal] = useState<SubscriptionPlan | null>(null)
  const [userModal, setUserModal] = useState<string | null>(null)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)

  // Handle Theme switching (day / night / system)
  useEffect(() => {
    localStorage.setItem('motosync_theme', themeMode)
    if (themeMode === 'day') {
      setIsLight(true)
      document.documentElement.classList.add('theme-day')
      document.documentElement.classList.remove('theme-night', 'dark')
    } else if (themeMode === 'night') {
      setIsLight(false)
      document.documentElement.classList.add('theme-night', 'dark')
      document.documentElement.classList.remove('theme-day')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsLight(!prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark', 'theme-night')
        document.documentElement.classList.remove('theme-day')
      } else {
        document.documentElement.classList.add('theme-day')
        document.documentElement.classList.remove('dark', 'theme-night')
      }
    }
  }, [themeMode])

  // Test backend status
  useEffect(() => {
    fetch(`${BACKEND_API_URL}/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  // Web Audio engine for previewing motorcycle exhaust sounds
  const playSynthesizedExhaust = (sound: ExhaustSound) => {
    if (playingSoundId === sound.id) {
      setPlayingSoundId(null)
      return
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const freq =
        sound.synthPreset === 'bullet_thump'
          ? 55
          : sound.synthPreset === 'ninja_inline4'
          ? 140
          : sound.synthPreset === 'ducati_v4'
          ? 110
          : sound.synthPreset === 'triumph_triple'
          ? 95
          : 75

      osc.type = sound.synthPreset === 'bullet_thump' ? 'square' : 'sawtooth'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 1.2)
      osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 2.5)

      gain.gain.setValueAtTime(0.01, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3)
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 2.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 2.9)

      setPlayingSoundId(sound.id)
      setTimeout(() => {
        setPlayingSoundId((prev) => (prev === sound.id ? null : prev))
      }, 2900)
    } catch {
      pushToast('Audio preview', 'Web Audio API not supported on this browser.', 'warn')
    }
  }

  const proUsers = users.filter((user) => user.isPro)
  const mrrInr = proUsers.reduce((sum, user) => {
    const plan = plans.find((item) => item.id === user.planId)
    return sum + (plan?.priceInr ?? 0)
  }, 0)

  const totalRevenueInr = purchases.reduce((sum, p) => sum + p.amountInr, 0)

  const pushAction = async (message: string, fn: () => Promise<void>) => {
    try {
      await fn()
      pushToast('Saved', message, 'success')
    } catch (error) {
      pushToast('Cloud write failed', error instanceof Error ? error.message : 'Check RLS / super admin role.', 'warn')
    }
  }

  const pullConfig = async () => {
    setPulling(true)
    const snapshot = await fetchPlatformConfig()
    if (snapshot) {
      applySnapshot(snapshot, undefined, 'supabase')
      pushToast('Config synced', 'Pulled latest platform config from Supabase.', 'success')
    } else {
      pushToast('Sync skipped', 'No config returned from Supabase or offline.', 'warn')
    }
    setPulling(false)
  }

  const navGroups: NavGroup[] = [
    {
      group: 'COMMAND CENTER',
      items: [
        { id: 'overview', label: 'Overview & KPIs', icon: Activity },
      ],
    },
    {
      group: 'COMMUNITY & RIDERS',
      items: [
        { id: 'users', label: 'Registered Riders', icon: Users, badge: `${users.length}` },
        { id: 'clubs', label: 'Ride Groups & Clubs', icon: Shield, badge: `${clubs.length}` },
      ],
    },
    {
      group: 'MONETIZATION & SALES',
      items: [
        { id: 'plans', label: 'Subscription Plans', icon: Gauge, badge: `${plans.length}` },
        { id: 'reports', label: 'Purchases & Revenue', icon: BarChart3, badge: `${purchases.length}` },
        { id: 'campaigns', label: 'Pitstop Ad Cards', icon: Megaphone, badge: `${campaigns.filter((c) => c.isActive).length}` },
      ],
    },
    {
      group: 'FEATURE GOVERNANCE',
      items: [
        { id: 'flags', label: 'Feature Controls', icon: Flag, badge: `${flags.filter((f) => f.isEnabled).length}/${flags.length}` },
        { id: 'sounds', label: 'Exhaust Sound Vault', icon: Volume2, badge: `${sounds.length}` },
      ],
    },
    {
      group: 'SYSTEM & SECURITY',
      items: [
        { id: 'settings', label: 'Platform & Themes', icon: Settings },
      ],
    },
  ]

  const userDetail = users.find((user) => user.id === userModal)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.primaryBike.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'pro'
          ? u.isPro
          : u.role === userRoleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, userRoleFilter])

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        p.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.riderHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.planName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter =
        purchaseFilter === 'all' ? true : p.billingInterval === purchaseFilter
      return matchesSearch && matchesFilter
    })
  }, [purchases, searchQuery, purchaseFilter])

  return (
    <div
      className={cx(
        'flex h-screen h-[100dvh] w-full overflow-hidden antialiased transition-colors duration-200 selection:bg-amber-400 selection:text-black',
        isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#07090E] text-slate-100',
      )}
    >
      {/* ------------------------------------------------------------- */}
      {/* LEFT-SIDEBAR NAVIGATION                                       */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r transition-transform duration-300 lg:relative lg:translate-x-0',
          isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/[0.08] bg-[#0B0F19] backdrop-blur-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className={cx('flex h-16 shrink-0 items-center justify-between border-b px-5', isLight ? 'border-slate-200' : 'border-white/[0.08]')}>
          <div className="flex items-center gap-3">
            <Logo compact />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cx('font-display text-sm font-black tracking-wider', isLight ? 'text-slate-900' : 'text-white')}>MOTOSYNC</span>
                <span className="rounded bg-amber-400/10 px-1 py-0.2 text-[8px] font-bold tracking-widest text-amber-500 uppercase">ERP</span>
              </div>
              <p className={cx('text-[8px] font-semibold tracking-[0.2em] uppercase', isLight ? 'text-slate-400' : 'text-white/40')}>Super Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Modules & Submodules */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className={cx('px-3 text-[9px] font-bold tracking-[0.25em] uppercase', isLight ? 'text-slate-400' : 'text-white/30')}>{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = currentModule === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentModule(item.id)
                        setSidebarOpen(false)
                      }}
                      className={cx(
                        'relative group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150',
                        active
                          ? isLight
                            ? 'text-amber-950 font-semibold'
                            : 'text-amber-300 font-semibold'
                          : isLight
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]',
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className={cx(
                            'absolute inset-0 rounded-xl border-l-[3px]',
                            isLight
                              ? 'bg-amber-100/70 border-amber-500 shadow-sm'
                              : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
                          )}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2.5">
                        <Icon
                          className={cx(
                            'h-4 w-4 transition-transform group-hover:scale-110',
                            active
                              ? isLight
                                ? 'text-amber-600'
                                : 'text-amber-400'
                              : isLight
                              ? 'text-slate-400'
                              : 'text-white/40',
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={cx(
                            'relative z-10 rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors',
                            active
                              ? isLight
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-amber-400/25 text-amber-300'
                              : isLight
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-white/[0.06] text-white/40',
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className={cx('shrink-0 border-t p-3 space-y-2', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.08] bg-[#090D15]')}>
          <div className={cx('flex items-center justify-between rounded-xl border p-2.5', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-white/[0.02]')}>
            <div className="flex items-center gap-2">
              <span className={cx('h-2 w-2 rounded-full animate-pulse', dataMode === 'live' ? 'bg-emerald-500' : 'bg-amber-400')} />
              <div>
                <p className={cx('text-[10px] font-semibold', isLight ? 'text-slate-900' : 'text-white')}>{dataMode === 'live' ? 'Live Cloud' : 'Demo Mode'}</p>
                <p className={cx('text-[8px]', isLight ? 'text-slate-500' : 'text-white/35')}>Supabase Realtime</p>
              </div>
            </div>
            <span className={cx('rounded px-1.5 py-0.5 text-[8px] font-mono', isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.06] text-white/40')}>
              {backendStatus === 'online' ? 'API 200' : 'Standby'}
            </span>
          </div>

          <a
            href={RIDER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              'flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-[11px] font-medium transition',
              isLight
                ? 'border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800'
                : 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300',
            )}
          >
            <span>Launch Rider App</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false)
          }}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* MAIN LAYOUT WRAPPER                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* ----------------------------------------------------------- */}
        {/* TOP NAVBAR (Profile, Notifications & Theme Switcher)        */}
        {/* ----------------------------------------------------------- */}
        <header
          className={cx(
            'shrink-0 z-20 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6',
            isLight ? 'border-slate-200 bg-white/95' : 'border-white/[0.08] bg-[#07090E]/95',
          )}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={cx('rounded-xl border p-2 lg:hidden', isLight ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-white/10 bg-white/[0.04] text-white/60')}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <div className={cx('flex items-center gap-2 text-xs', isLight ? 'text-slate-400' : 'text-white/40')}>
                <span>MotoSync ERP</span>
                <ChevronRight className="h-3 w-3" />
                <span className={cx('font-semibold capitalize', isLight ? 'text-slate-900' : 'text-white')}>{currentModule.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Topbar Right Section: Theme Selector, Sync, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Theme Selector (Day / Night / System) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition',
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white',
                )}
                title="Change theme appearance"
              >
                {themeMode === 'day' ? (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                ) : themeMode === 'night' ? (
                  <Moon className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                )}
                <span className="capitalize hidden md:inline">{themeMode}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>

              <AnimatePresence>
                {themeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className={cx(
                      'absolute right-0 mt-2 w-44 rounded-2xl border p-1.5 shadow-2xl z-50',
                      isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0F1420]',
                    )}
                  >
                    {[
                      { id: 'day', label: 'Day (Light)', icon: Sun },
                      { id: 'night', label: 'Night (Dark)', icon: Moon },
                      { id: 'system', label: 'Auto (System)', icon: Sparkles },
                    ].map((item) => {
                      const Icon = item.icon
                      const selected = themeMode === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setThemeMode(item.id as ThemeMode)
                            setThemeMenuOpen(false)
                            pushToast('Theme Changed', `Appearance set to ${item.label}.`, 'default')
                          }}
                          className={cx(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition',
                            selected
                              ? isLight
                                ? 'bg-amber-100/60 text-amber-900 font-semibold'
                                : 'bg-white/10 text-white font-semibold'
                              : isLight
                              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </div>
                          {selected ? <Check className="h-3.5 w-3.5 text-amber-500" /> : null}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick sync button */}
            <Button
              size="xs"
              variant="ghost"
              icon={<RefreshCw className={cx('h-3.5 w-3.5', pulling && 'animate-spin text-amber-500')} />}
              onClick={pullConfig}
              loading={pulling}
              className={cx('hidden md:inline-flex border', isLight ? 'border-slate-200 bg-white text-slate-700' : 'border-white/[0.07]')}
            >
              Sync Cloud
            </Button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={cx(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl border transition',
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
                )}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cx(
                      'absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-2xl z-50',
                      isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0F1420]',
                    )}
                  >
                    <div className={cx('flex items-center justify-between border-b pb-3', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                      <p className={cx('text-xs font-bold uppercase tracking-wider', isLight ? 'text-slate-900' : 'text-white')}>System Notifications</p>
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500">3 new</span>
                    </div>
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className={cx('rounded-xl border p-2.5', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Supabase Realtime Connected</p>
                        <p className={cx('text-[10px] mt-0.5', isLight ? 'text-slate-500' : 'text-white/40')}>PostgreSQL changes streaming over WebSocket.</p>
                      </div>
                      <div className={cx('rounded-xl border p-2.5', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Road Captain PRO Plan Active</p>
                        <p className={cx('text-[10px] mt-0.5', isLight ? 'text-slate-500' : 'text-white/40')}>412 active subscriptions synced with backend.</p>
                      </div>
                      <div className={cx('rounded-xl border p-2.5', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Vercel API Online</p>
                        <p className={cx('text-[10px] mt-0.5', isLight ? 'text-slate-500' : 'text-white/40')}>Production REST gateway responding in 24ms.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile / Super Admin Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={cx(
                  'flex items-center gap-2.5 rounded-2xl border p-1.5 pr-3 transition',
                  isLight
                    ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    : 'border-white/[0.08] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]',
                )}
              >
                <div className="relative">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 font-bold text-[11px] text-black">
                    HS
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#07090E] bg-emerald-400" />
                </div>
                <div className="text-left hidden md:block">
                  <p className={cx('text-xs font-semibold leading-none', isLight ? 'text-slate-900' : 'text-white')}>Harpreet Singh</p>
                  <p className="text-[9px] font-medium leading-none text-amber-500 mt-0.5">SUPER ADMIN</p>
                </div>
                <ChevronDown className={cx('h-3.5 w-3.5', isLight ? 'text-slate-400' : 'text-white/40')} />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cx(
                      'absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 space-y-1',
                      isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0F1420]',
                    )}
                  >
                    <div className={cx('px-3 py-2 border-b', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                      <p className={cx('text-xs font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Harpreet Singh</p>
                      <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>harpreetsingh6051@gmail.com</p>
                    </div>
                    <a
                      href={RIDER_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx('flex items-center justify-between rounded-xl px-3 py-2 text-xs transition', isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
                    >
                      <span>Switch to Rider App</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        resetConfig()
                        setProfileMenuOpen(false)
                        pushToast('Demo Cache Cleared', 'Reset to factory seed settings.', 'success')
                      }}
                      className={cx('flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs transition', isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reset Local State
                    </button>
                    <div className={cx('pt-1 border-t', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          pushToast('Session Active', 'You are logged in as Super Admin.', 'default')
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ----------------------------------------------------------- */}
        {/* MAIN MODULE CONTENT VIEWPORT                                */}
        {/* ----------------------------------------------------------- */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-thin">
          {/* ========================================================= */}
          {/* 1. OVERVIEW & KPIS                                        */}
          {/* ========================================================= */}
          {currentModule === 'overview' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Platform Command Center</h1>
                <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Real-time health, monetization telemetry, and pack activities.</p>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Total Registered Riders',
                    value: users.length.toString(),
                    trend: '+14% this month',
                    icon: Users,
                    color: 'text-cyan-500',
                    gradient: 'from-cyan-500/20 to-transparent',
                  },
                  {
                    label: 'Active PRO Subscribers',
                    value: proUsers.length.toString(),
                    trend: `${((proUsers.length / Math.max(users.length, 1)) * 100).toFixed(1)}% conversion`,
                    icon: Sparkles,
                    color: 'text-amber-500',
                    gradient: 'from-amber-500/20 to-transparent',
                  },
                  {
                    label: 'Total Purchases Revenue',
                    value: money(totalRevenueInr),
                    trend: `From ${purchases.length} settled orders`,
                    icon: BarChart3,
                    color: 'text-emerald-500',
                    gradient: 'from-emerald-500/20 to-transparent',
                  },
                  {
                    label: 'Active Ride Clubs',
                    value: clubs.length.toString(),
                    trend: 'Across 4 metropolitan hubs',
                    icon: Shield,
                    color: 'text-rose-500',
                    gradient: 'from-rose-500/20 to-transparent',
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className={cx(
                      'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-md',
                      isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]',
                    )}
                  >
                    <div className={cx('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', kpi.gradient)} />
                    <div className="flex items-center justify-between">
                      <p className={cx('text-[11px] font-semibold tracking-wider uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>{kpi.label}</p>
                      <kpi.icon className={cx('h-4 w-4', kpi.color)} />
                    </div>
                    <p className={cx('mt-3 font-display text-3xl font-extrabold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>{kpi.value}</p>
                    <p className={cx('mt-2 text-[10px] font-medium', isLight ? 'text-slate-500' : 'text-white/40')}>{kpi.trend}</p>
                  </div>
                ))}
              </div>

              {/* Grid: Plan Distribution & Realtime Telemetry */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className={cx('rounded-2xl border p-5 lg:col-span-2 space-y-4 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <div className={cx('flex items-center justify-between border-b pb-3', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                    <div>
                      <h2 className={cx('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Subscription Tier Distribution</h2>
                      <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>Active paying riders across catalog tiers</p>
                    </div>
                    <Button size="xs" variant="ghost" onClick={() => setCurrentModule('plans')}>
                      Manage Tiers
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {plans
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className={cx(
                            'rounded-xl border p-4 transition',
                            isLight ? 'border-slate-200 bg-slate-50/60 hover:border-amber-400' : 'border-white/[0.06] bg-white/[0.02] hover:border-amber-400/30',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cx('text-xs font-bold', isLight ? 'text-slate-900' : 'text-white')}>{plan.name}</span>
                            <GoldenHelmetBadge badgeType={plan.badgeType} size="xs" />
                          </div>
                          <p className={cx('mt-3 font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>{plan.subscribersCount}</p>
                          <p className={cx('text-[10px] mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>
                            {plan.priceInr === 0 ? 'Free tier' : `${money(plan.priceInr)} / ${plan.billingInterval}`}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className={cx('rounded-2xl border p-5 space-y-4 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <div className={cx('flex items-center justify-between border-b pb-3', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                    <h2 className={cx('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Live Infrastructure</h2>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className={cx('flex items-center justify-between rounded-xl border p-3', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                      <div>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Supabase Cloud Database</p>
                        <p className={cx('text-[9px]', isLight ? 'text-slate-500' : 'text-white/40')}>PostgreSQL 17.11 with PostGIS</p>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">HEALTHY</span>
                    </div>

                    <div className={cx('flex items-center justify-between rounded-xl border p-3', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                      <div>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>NestJS Backend Gateway</p>
                        <p className={cx('text-[9px]', isLight ? 'text-slate-500' : 'text-white/40')}>Vercel Serverless Function</p>
                      </div>
                      <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                        {backendStatus === 'online' ? 'CONNECTED' : 'CHECKING'}
                      </span>
                    </div>

                    <div className={cx('flex items-center justify-between rounded-xl border p-3', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                      <div>
                        <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>Helmet Intercom Relay</p>
                        <p className={cx('text-[9px]', isLight ? 'text-slate-500' : 'text-white/40')}>WebRTC Mesh Bridge</p>
                      </div>
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. REGISTERED RIDERS CRM                                  */}
          {/* ========================================================= */}
          {currentModule === 'users' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors space-y-4 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Registered Riders & CRM</h1>
                    <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>All riders registered on MotoSync with bike details and account status.</p>
                  </div>
                </div>

                {/* Search & Role Filter Tabs */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className={cx('absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4', isLight ? 'text-slate-400' : 'text-white/40')} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, @handle, bike model, or city..."
                      className={cx(
                        'w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-amber-500',
                        isLight ? 'border-slate-200 bg-white text-slate-900 placeholder-slate-400' : 'border-white/10 bg-[#0E131F] text-white placeholder-white/30',
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                    {['all', 'super_admin', 'road_captain', 'rider', 'pro'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setUserRoleFilter(role)}
                        className={cx(
                          'rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap capitalize transition',
                          userRoleFilter === role
                            ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/40'
                            : isLight
                            ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                            : 'bg-white/[0.04] text-white/50 hover:text-white',
                        )}
                      >
                        {role.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Directory Table */}
              <div className={cx('overflow-hidden rounded-2xl border shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={cx('border-b text-[10px] font-semibold uppercase tracking-wider', isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/[0.08] bg-white/[0.02] text-white/40')}>
                      <tr>
                        <th className="px-5 py-3">Rider Profile</th>
                        <th className="px-5 py-3">Motorcycle Model</th>
                        <th className="px-5 py-3">Subscription</th>
                        <th className="px-5 py-3">System Role</th>
                        <th className="px-5 py-3">Total KM</th>
                        <th className="px-5 py-3">Registered</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={cx('divide-y', isLight ? 'divide-slate-200' : 'divide-white/[0.04]')}>
                      {filteredUsers.map((user) => {
                        const plan = plans.find((p) => p.id === user.planId)
                        return (
                          <tr key={user.id} className={cx('transition', isLight ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.02]')}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar name={user.fullName} accent={user.accent} size="sm" />
                                <div>
                                  <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>{user.fullName}</p>
                                  <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>@{user.handle} · {user.city}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cx('font-medium', isLight ? 'text-slate-800' : 'text-white/80')}>{user.primaryBike}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium', isLight ? 'border-slate-200 bg-slate-100 text-slate-800' : 'border-white/10 bg-white/[0.03] text-white')}>
                                <GoldenHelmetBadge badgeType={plan?.badgeType ?? (user.isPro ? 'golden_helmet' : 'none')} size="xs" />
                                <span>{plan?.name ?? (user.isPro ? 'PRO' : 'Free Rider')}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cx(
                                  'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                                  user.role === 'super_admin'
                                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                    : user.role === 'road_captain'
                                    ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/30'
                                    : isLight
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-white/[0.06] text-white/50',
                                )}
                              >
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px]">{user.totalKm.toLocaleString()} km</td>
                            <td className="px-5 py-3.5 text-slate-400 text-[11px]">{user.registeredAt}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cx(
                                  'inline-flex items-center gap-1 text-[11px]',
                                  user.status === 'active' ? 'text-emerald-500' : 'text-rose-500',
                                )}
                              >
                                <span className={cx('h-1.5 w-1.5 rounded-full', user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                                <span className="capitalize">{user.status}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Button size="xs" variant="ghost" onClick={() => setUserModal(user.id)}>
                                Manage
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. RIDE GROUPS & CLUBS                                    */}
          {/* ========================================================= */}
          {currentModule === 'clubs' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <div>
                  <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Ride Groups & Clubs</h1>
                  <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Club lounges, verified captain rosters, and member communities.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    className={cx(
                      'rounded-2xl border p-5 shadow-sm transition hover:shadow-md space-y-4 flex flex-col justify-between',
                      isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]',
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{club.badgeEmoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={cx('font-display text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>{club.name}</h3>
                              {club.verified ? (
                                <span title="Verified Pack Club">
                                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                </span>
                              ) : null}
                            </div>
                            <p className={cx('text-xs font-mono', isLight ? 'text-slate-500' : 'text-white/40')}>@{club.handle} · {club.city}, {club.region}</p>
                          </div>
                        </div>
                        <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', club.privacy === 'public' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
                          {club.privacy.replace('_', ' ')}
                        </span>
                      </div>

                      <p className={cx('text-xs mt-3 leading-relaxed', isLight ? 'text-slate-600' : 'text-white/60')}>{club.description}</p>

                      <div className={cx('mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs', isLight ? 'border-slate-200' : 'border-white/[0.06]')}>
                        <div>
                          <p className={cx('text-[9px] uppercase font-bold', isLight ? 'text-slate-400' : 'text-white/40')}>Members</p>
                          <p className={cx('font-bold text-sm mt-0.5', isLight ? 'text-slate-900' : 'text-white')}>{club.memberCount}</p>
                        </div>
                        <div>
                          <p className={cx('text-[9px] uppercase font-bold', isLight ? 'text-slate-400' : 'text-white/40')}>On Road</p>
                          <p className="font-bold text-sm mt-0.5 text-amber-500">{club.ridingNow}</p>
                        </div>
                        <div>
                          <p className={cx('text-[9px] uppercase font-bold', isLight ? 'text-slate-400' : 'text-white/40')}>Founded</p>
                          <p className={cx('font-bold text-sm mt-0.5', isLight ? 'text-slate-900' : 'text-white')}>{club.founded}</p>
                        </div>
                      </div>
                    </div>

                    <div className={cx('border-t pt-3 flex items-center justify-between', isLight ? 'border-slate-200' : 'border-white/[0.06]')}>
                      <span className={cx('text-[11px] font-medium', isLight ? 'text-slate-500' : 'text-white/40')}>Style: {club.ridingStyle}</span>
                      <Button
                        size="xs"
                        variant={club.verified ? 'ghost' : 'secondary'}
                        onClick={() => {
                          club.verified = !club.verified
                          updateClubVerification(club.id, club.verified)
                          pushToast('Club Status', `${club.name} verified badge ${club.verified ? 'granted' : 'revoked'}.`, 'default')
                        }}
                      >
                        {club.verified ? 'Revoke Shield' : 'Grant Verified'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SUBSCRIPTION PLANS & TIERS                             */}
          {/* ========================================================= */}
          {currentModule === 'plans' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <div>
                  <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Subscription Catalog</h1>
                  <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Configure prices, limits, and rider badge perks across tiers.</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() =>
                    setPlanModal({
                      id: `plan_${Date.now()}`,
                      name: 'New Custom Tier',
                      tagline: 'Custom rider package',
                      badgeType: 'none',
                      audience: 'rider',
                      priceInr: 299,
                      priceUsd: 5.99,
                      billingInterval: 'monthly',
                      isPopular: false,
                      isActive: true,
                      sortOrder: plans.length,
                      features: ['Custom feature 1', 'Custom feature 2'],
                      limits: { watermark: false, offlineGpx: true, familyLinks: true, reelQuality: '4K', aiScansPerMonth: 50 },
                      subscribersCount: 0,
                    })
                  }
                >
                  Create Plan Tier
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className={cx(
                        'relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:shadow-md',
                        plan.isPopular
                          ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent'
                          : isLight
                          ? 'border-slate-200 bg-white'
                          : 'border-white/[0.08] bg-[#0E131F]',
                      )}
                    >
                      {plan.isPopular ? (
                        <span className="absolute top-4 right-4 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider">
                          POPULAR
                        </span>
                      ) : null}

                      <div>
                        <div className="flex items-center gap-2">
                          <GoldenHelmetBadge badgeType={plan.badgeType} size="sm" />
                          <h3 className={cx('font-display text-lg font-bold', isLight ? 'text-slate-900' : 'text-white')}>{plan.name}</h3>
                        </div>
                        <p className={cx('mt-1 text-xs', isLight ? 'text-slate-500' : 'text-white/50')}>{plan.tagline}</p>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className={cx('font-display text-3xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>{money(plan.priceInr)}</span>
                          <span className={cx('text-xs', isLight ? 'text-slate-500' : 'text-white/40')}>/ {plan.billingInterval}</span>
                          <span className={cx('ml-2 text-xs', isLight ? 'text-slate-400' : 'text-white/30')}>(${plan.priceUsd})</span>
                        </div>

                        <div className={cx('mt-4 border-t pt-3 space-y-1.5', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className={cx('flex items-start gap-2 text-xs', isLight ? 'text-slate-700' : 'text-white/70')}>
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={cx('mt-6 border-t pt-4 flex items-center justify-between', isLight ? 'border-slate-200' : 'border-white/[0.07]')}>
                        <div className="flex items-center gap-2">
                          <Toggle
                            label="Active"
                            checked={plan.isActive}
                            onChange={(val) => {
                              upsertPlan({ ...plan, isActive: val })
                              pushAction(`Plan status updated to ${val ? 'active' : 'inactive'}`, async () => {
                                await savePlan({ ...plan, isActive: val })
                              })
                            }}
                          />
                          <span className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>{plan.isActive ? 'Active' : 'Disabled'}</span>
                        </div>
                        <Button size="xs" variant="ghost" onClick={() => setPlanModal(plan)}>
                          Edit Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. PURCHASES & REVENUE REPORTS                            */}
          {/* ========================================================= */}
          {currentModule === 'reports' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <div>
                  <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Subscription Purchases Report</h1>
                  <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Audit log of all rider membership purchases, transaction IDs, and settlement status.</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => pushToast('Export Initiated', 'Subscription report CSV generated.', 'success')}
                >
                  Export CSV Report
                </Button>
              </div>

              {/* Revenue Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={cx('rounded-2xl border p-5 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <p className={cx('text-xs font-semibold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-white/40')}>Settled Revenue</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-emerald-500">{money(totalRevenueInr)}</p>
                  <p className={cx('text-[10px] mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>From 5 completed orders</p>
                </div>
                <div className={cx('rounded-2xl border p-5 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <p className={cx('text-xs font-semibold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-white/40')}>Monthly Recurring Run-Rate</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-amber-500">{money(mrrInr)}</p>
                  <p className={cx('text-[10px] mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Projected MRR based on active subscribers</p>
                </div>
                <div className={cx('rounded-2xl border p-5 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <p className={cx('text-xs font-semibold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-white/40')}>Average Order Value (AOV)</p>
                  <p className={cx('mt-2 font-display text-3xl font-extrabold', isLight ? 'text-slate-900' : 'text-white')}>
                    {money(totalRevenueInr / Math.max(purchases.length, 1))}
                  </p>
                  <p className={cx('text-[10px] mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Blended monthly + annual tiers</p>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className={cx('overflow-hidden rounded-2xl border shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={cx('border-b text-[10px] font-semibold uppercase tracking-wider', isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/[0.08] bg-white/[0.02] text-white/40')}>
                      <tr>
                        <th className="px-5 py-3">Transaction ID</th>
                        <th className="px-5 py-3">Rider</th>
                        <th className="px-5 py-3">Plan Purchased</th>
                        <th className="px-5 py-3">Amount Paid</th>
                        <th className="px-5 py-3">Payment Method</th>
                        <th className="px-5 py-3">Date & Time</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className={cx('divide-y', isLight ? 'divide-slate-200' : 'divide-white/[0.04]')}>
                      {filteredPurchases.map((tx) => (
                        <tr key={tx.id} className={cx('transition', isLight ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.02]')}>
                          <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">{tx.transactionId}</td>
                          <td className="px-5 py-3.5">
                            <p className={cx('font-semibold', isLight ? 'text-slate-900' : 'text-white')}>{tx.riderName}</p>
                            <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>@{tx.riderHandle}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cx('rounded-lg px-2 py-0.5 text-[11px] font-medium border', isLight ? 'border-slate-200 bg-slate-100 text-slate-800' : 'border-white/10 bg-white/[0.04] text-white')}>
                              {tx.planName} ({tx.billingInterval})
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-display text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {money(tx.amountInr)} <span className="text-[10px] font-normal text-slate-400">(${tx.amountUsd})</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-[11px]">{tx.paymentMethod}</td>
                          <td className="px-5 py-3.5 text-slate-400 text-[11px]">{tx.purchasedAt}</td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. FEATURE GOVERNANCE & PER-MODULE CONTROLS               */}
          {/* ========================================================= */}
          {currentModule === 'flags' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Feature Governance & Module Switches</h1>
                <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Enable/disable features per module, adjust pack radar thresholds, and configure helmet intercom.</p>
              </div>

              {/* Dedicated Module Settings Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Helmet Intercom Bridge */}
                <div className={cx('rounded-2xl border p-5 shadow-sm space-y-4', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-amber-400/10 p-2 text-amber-500">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={cx('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Helmet Intercom Bridge</h3>
                        <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>Full-duplex Bluetooth & WebRTC mesh voice relay</p>
                      </div>
                    </div>
                    <Toggle
                      label="Intercom Active"
                      checked={flags.find((f) => f.key === 'intercom_bridge')?.isEnabled ?? true}
                      onChange={(val) => {
                        const target = flags.find((f) => f.key === 'intercom_bridge')
                        if (target) {
                          upsertFlag({ ...target, isEnabled: val })
                          pushAction(`Intercom bridge ${val ? 'enabled' : 'disabled'}`, async () => {
                            await saveFlag({ ...target, isEnabled: val })
                          })
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Audio Codec Quality</label>
                      <select
                        value={intercomCodec}
                        onChange={(e) => setIntercomCodec(e.target.value as typeof intercomCodec)}
                        className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                      >
                        <option value="opus_48k_hd">Opus 48 kHz (Studio HD - Wind Noise Filtered)</option>
                        <option value="opus_24k">Opus 24 kHz (Ultra-Low Latency Bandwidth Saver)</option>
                      </select>
                    </div>

                    <div>
                      <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Max Concurrent Speakers in Pack</label>
                      <select
                        value={intercomMaxSpeakers}
                        onChange={(e) => setIntercomMaxSpeakers(Number(e.target.value))}
                        className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                      >
                        <option value={4}>4 Riders (Standard Mesh)</option>
                        <option value={8}>8 Riders (PRO Pack Relay)</option>
                        <option value={16}>16 Riders (Club Shield Only)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Pack Live Radar & Telemetry */}
                <div className={cx('rounded-2xl border p-5 shadow-sm space-y-4', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-500">
                        <Radio className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={cx('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Pack Live Radar & Telemetry</h3>
                        <p className={cx('text-[10px]', isLight ? 'text-slate-500' : 'text-white/40')}>Spatial compass, fall-behind alerts, and speed broadcasting</p>
                      </div>
                    </div>
                    <Toggle
                      label="Radar Active"
                      checked={flags.find((f) => f.key === 'radar_tail_gunner_warning')?.isEnabled ?? true}
                      onChange={(val) => {
                        const target = flags.find((f) => f.key === 'radar_tail_gunner_warning')
                        if (target) {
                          upsertFlag({ ...target, isEnabled: val })
                          pushAction(`Radar sweep warning ${val ? 'enabled' : 'disabled'}`, async () => {
                            await saveFlag({ ...target, isEnabled: val })
                          })
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Sweep Fall-Behind Warning Threshold</label>
                        <span className="font-mono text-amber-500 font-bold">{radarThresholdKm} km</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={radarThresholdKm}
                        onChange={(e) => setRadarThresholdKm(Number(e.target.value))}
                        className="mt-2 w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>GPS WebSocket Telemetry Pulse</label>
                      <select
                        value={radarGpsInterval}
                        onChange={(e) => setRadarGpsInterval(e.target.value as typeof radarGpsInterval)}
                        className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                      >
                        <option value="1s">1 second (High Accuracy - Pro Rigs)</option>
                        <option value="3s">3 seconds (Balanced Battery)</option>
                        <option value="5s">5 seconds (Eco Mode)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Platform Feature Flags List */}
              <div className={cx('rounded-2xl border shadow-sm divide-y', isLight ? 'border-slate-200 bg-white divide-slate-200' : 'border-white/[0.08] bg-[#0E131F] divide-white/[0.06]')}>
                {flags.map((flag) => (
                  <div key={flag.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-500">{flag.key}</span>
                        {flag.accessLevel === 'pro_only' ? (
                          <span className="rounded bg-amber-400/10 px-1.5 py-0.2 text-[8px] font-bold text-amber-600 dark:text-amber-300 uppercase">PRO ONLY</span>
                        ) : null}
                      </div>
                      <p className={cx('text-xs font-semibold', isLight ? 'text-slate-900' : 'text-white')}>{flag.name}</p>
                      <p className={cx('text-[11px]', isLight ? 'text-slate-500' : 'text-white/40')}>{flag.description}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={cx('text-[10px]', isLight ? 'text-slate-400' : 'text-white/40')}>Rollout %</p>
                        <p className={cx('text-xs font-bold font-mono', isLight ? 'text-slate-800' : 'text-white')}>{flag.rolloutPercentage}%</p>
                      </div>
                      <Toggle
                        label="Enabled"
                        checked={flag.isEnabled}
                        onChange={(val) => {
                          upsertFlag({ ...flag, isEnabled: val })
                          pushAction(`Feature flag ${flag.key} toggled`, async () => {
                            await saveFlag({ ...flag, isEnabled: val })
                          })
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. DIGITAL GARAGE EXHAUST SOUNDS                          */}
          {/* ========================================================= */}
          {currentModule === 'sounds' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Digital Garage Exhaust Vault</h1>
                <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Motorcycle acoustic synthesis signatures and tachometer audio engine.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sounds.map((sound) => (
                  <div key={sound.id} className={cx('rounded-2xl border p-5 space-y-4 shadow-sm', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={cx('font-display text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>{sound.name}</h3>
                        <p className="text-xs font-mono text-amber-500">{sound.engineConfiguration}</p>
                      </div>
                      {sound.isProOnly ? (
                        <span className="flex items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300">
                          <Lock className="h-3 w-3" /> PRO
                        </span>
                      ) : (
                        <span className={cx('rounded px-2 py-0.5 text-[9px] font-bold', isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.06] text-white/50')}>FREE</span>
                      )}
                    </div>

                    <p className={cx('text-xs', isLight ? 'text-slate-600' : 'text-white/50')}>{sound.brand} · Preset: {sound.synthPreset.replace('_', ' ')}</p>

                    <div className={cx('flex items-center justify-between text-[11px] border-t pt-3', isLight ? 'border-slate-200 text-slate-500' : 'border-white/[0.06] text-white/40')}>
                      <span>Acoustic Output: {sound.decibels} dB</span>
                      <span className="capitalize">Tier: {sound.isProOnly ? 'PRO' : 'Standard'}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Button
                        size="xs"
                        variant={playingSoundId === sound.id ? 'cyan' : 'secondary'}
                        icon={playingSoundId === sound.id ? <Square className="h-3.5 w-3.5 animate-pulse" /> : <Play className="h-3.5 w-3.5" />}
                        onClick={() => playSynthesizedExhaust(sound)}
                      >
                        {playingSoundId === sound.id ? 'Playing Note...' : 'Preview Sound'}
                      </Button>
                      <Toggle
                        label="Active"
                        checked={sound.isActive}
                        onChange={(val) => {
                          upsertSound({ ...sound, isActive: val })
                          pushAction(`Sound ${sound.name} toggled`, async () => {
                            await saveSound({ ...sound, isActive: val })
                          })
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. SPONSORED PITSTOP CAMPAIGNS                            */}
          {/* ========================================================= */}
          {currentModule === 'campaigns' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Sponsored Pitstop Campaigns</h1>
                <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Configure geo-targeted sponsor cards along pack ride routes.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className={cx('overflow-hidden rounded-2xl border shadow-sm flex flex-col justify-between', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={cx('font-display text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>{camp.sponsorName}</span>
                        <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', camp.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 text-slate-500')}>
                          {camp.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-500">{camp.title}</p>
                      <p className={cx('text-xs', isLight ? 'text-slate-600' : 'text-white/60')}>{camp.perkOffer}</p>
                      <div className={cx('flex items-center justify-between text-[11px] pt-2 border-t', isLight ? 'border-slate-200 text-slate-500' : 'border-white/[0.06] text-white/40')}>
                        <span>Region: {camp.region}</span>
                        <span>CPM: ${camp.cpmRateUsd}</span>
                      </div>
                    </div>
                    <div className={cx('p-4 border-t flex items-center justify-between', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.02]')}>
                      <Toggle
                        label="Active"
                        checked={camp.isActive}
                        onChange={(val) => {
                          upsertCampaign({ ...camp, isActive: val })
                          pushAction(`Campaign ${camp.sponsorName} updated`, async () => {
                            await saveCampaign({ ...camp, isActive: val })
                          })
                        }}
                      />
                      <Button size="xs" variant="ghost" onClick={() => pushToast('Campaign Link', camp.ctaUrl || 'No external URL configured', 'default')}>
                        View Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. PLATFORM SETTINGS & THEMES                             */}
          {/* ========================================================= */}
          {currentModule === 'settings' && (
            <div className="space-y-6">
              <div className={cx('sticky top-0 z-20 -mx-4 -mt-4 px-4 pt-4 pb-4 backdrop-blur-xl border-b transition-colors sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8', isLight ? 'bg-[#F8FAFC]/95 border-slate-200 shadow-sm' : 'bg-[#07090E]/95 border-white/[0.08] shadow-sm')}>
                <h1 className={cx('font-display text-2xl font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>Platform Settings & Appearance</h1>
                <p className={cx('text-xs mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>Theme customizer, cross-app endpoints, and system controls.</p>
              </div>

              {/* Theme Settings Panel */}
              <div className={cx('rounded-2xl border p-5 shadow-sm space-y-4', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                <h3 className={cx('text-sm font-bold border-b pb-3', isLight ? 'border-slate-200 text-slate-900' : 'border-white/[0.07] text-white')}>Appearance & Theme Mode</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'day', title: 'Day Mode (Light)', desc: 'Clean daylight aesthetic with slate-900 typography.', icon: Sun },
                    { id: 'night', title: 'Night Mode (Dark)', desc: 'Motorcycle cockpit charcoal with neon accents.', icon: Moon },
                    { id: 'system', title: 'System Default', desc: 'Syncs automatically with your operating system mode.', icon: Sparkles },
                  ].map((t) => {
                    const Icon = t.icon
                    const selected = themeMode === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setThemeMode(t.id as ThemeMode)
                          pushToast('Theme Changed', `Appearance set to ${t.title}.`, 'default')
                        }}
                        className={cx(
                          'p-4 rounded-xl border text-left transition',
                          selected
                            ? 'border-amber-500 bg-amber-500/10'
                            : isLight
                            ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={cx('h-5 w-5', selected ? 'text-amber-500' : 'text-slate-400')} />
                          {selected ? <Check className="h-4 w-4 text-amber-500" /> : null}
                        </div>
                        <p className={cx('font-bold text-xs mt-3', isLight ? 'text-slate-900' : 'text-white')}>{t.title}</p>
                        <p className={cx('text-[10px] mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Endpoints & Cache */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className={cx('rounded-2xl border p-5 shadow-sm space-y-4', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <h3 className={cx('text-sm font-bold border-b pb-3', isLight ? 'border-slate-200 text-slate-900' : 'border-white/[0.07] text-white')}>Cloud Connection Endpoints</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className={cx('text-[10px] uppercase font-semibold', isLight ? 'text-slate-500' : 'text-white/40')}>Supabase Cloud URL</p>
                      <p className="font-mono mt-0.5 break-all text-amber-600 dark:text-amber-400">https://hxsifqmspboitoqnkvwj.supabase.co</p>
                    </div>
                    <div>
                      <p className={cx('text-[10px] uppercase font-semibold', isLight ? 'text-slate-500' : 'text-white/40')}>Backend REST API</p>
                      <p className="font-mono mt-0.5 break-all text-cyan-600 dark:text-cyan-400">{BACKEND_API_URL}</p>
                    </div>
                    <div>
                      <p className={cx('text-[10px] uppercase font-semibold', isLight ? 'text-slate-500' : 'text-white/40')}>Rider Web Application</p>
                      <p className="font-mono mt-0.5 break-all text-emerald-600 dark:text-emerald-400">{RIDER_APP_URL}</p>
                    </div>
                  </div>
                </div>

                <div className={cx('rounded-2xl border p-5 shadow-sm space-y-4', isLight ? 'border-slate-200 bg-white' : 'border-white/[0.08] bg-[#0E131F]')}>
                  <h3 className={cx('text-sm font-bold border-b pb-3', isLight ? 'border-slate-200 text-slate-900' : 'border-white/[0.07] text-white')}>Data & Cache Actions</h3>
                  <div className="space-y-3">
                    <Button full variant="secondary" onClick={pullConfig} loading={pulling}>
                      Pull Fresh Snapshot from Supabase
                    </Button>
                    <Button
                      full
                      variant="ghost"
                      onClick={() => {
                        resetConfig()
                        pushToast('Demo Restored', 'Platform state reset to initial seeds.', 'success')
                      }}
                    >
                      Reset Local Storage Seeds
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* USER MANAGEMENT MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      <Modal open={Boolean(userModal)} onClose={() => setUserModal(null)} title="Manage Rider Entitlements" subtitle={userDetail?.fullName}>
        {userDetail ? (
          <div className="space-y-4">
            <div className={cx('rounded-2xl border p-4 flex items-center gap-3', isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.03]')}>
              <Avatar name={userDetail.fullName} accent={userDetail.accent} size="md" />
              <div>
                <p className={cx('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>{userDetail.fullName}</p>
                <p className={cx('text-xs', isLight ? 'text-slate-500' : 'text-white/40')}>@{userDetail.handle} · {userDetail.city}</p>
                <p className="text-[10px] text-amber-500 font-medium mt-0.5">{userDetail.primaryBike}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Subscription Plan</label>
                <select
                  className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                  defaultValue={userDetail.planId}
                  onChange={(e) =>
                    setUserOverride(userDetail.id, {
                      planId: e.target.value,
                      isPro: e.target.value !== 'plan_free',
                    })
                  }
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({money(p.priceInr)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Platform Role</label>
                <select
                  className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                  defaultValue={userDetail.role}
                  onChange={(e) => setUserOverride(userDetail.id, { role: e.target.value as AdminRole })}
                >
                  <option value="rider">Rider (Default)</option>
                  <option value="road_captain">Road Captain</option>
                  <option value="club_admin">Club Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Account Status</label>
                <select
                  className={cx('mt-1 w-full rounded-xl border p-2 text-xs focus:outline-none', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                  defaultValue={userDetail.status}
                  onChange={(e) => setUserOverride(userDetail.id, { status: e.target.value as AccountStatus })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            <Button
              full
              variant="primary"
              onClick={() =>
                pushAction('User entitlement updated', async () => {
                  const state = useConfigStore.getState().overrides[userDetail.id]
                  await updateUserAdmin(userDetail.id, {
                    subscriptionPlanId: state?.planId,
                    role: state?.role,
                    status: state?.status,
                  })
                  await logAdminAction(currentUserId, 'user.update', 'profile', userDetail.id, {})
                  setUserModal(null)
                })
              }
            >
              Save Changes to Cloud
            </Button>
          </div>
        ) : null}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* PLAN EDIT MODAL                                               */}
      {/* ------------------------------------------------------------- */}
      <Modal open={Boolean(planModal)} onClose={() => setPlanModal(null)} title="Edit Subscription Plan" subtitle={planModal?.name}>
        {planModal ? (
          <div className="space-y-4">
            <div>
              <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Plan Name</label>
              <input
                type="text"
                defaultValue={planModal.name}
                onChange={(e) => (planModal.name = e.target.value)}
                className={cx('mt-1 w-full rounded-xl border p-2 text-xs', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Price (INR ₹)</label>
                <input
                  type="number"
                  defaultValue={planModal.priceInr}
                  onChange={(e) => (planModal.priceInr = Number(e.target.value))}
                  className={cx('mt-1 w-full rounded-xl border p-2 text-xs', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                />
              </div>
              <div>
                <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Price (USD $)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={planModal.priceUsd}
                  onChange={(e) => (planModal.priceUsd = Number(e.target.value))}
                  className={cx('mt-1 w-full rounded-xl border p-2 text-xs', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
                />
              </div>
            </div>

            <div>
              <label className={cx('text-[10px] font-bold uppercase', isLight ? 'text-slate-500' : 'text-white/40')}>Tagline</label>
              <input
                type="text"
                defaultValue={planModal.tagline}
                onChange={(e) => (planModal.tagline = e.target.value)}
                className={cx('mt-1 w-full rounded-xl border p-2 text-xs', isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-white/10 bg-[#0B0F19] text-white')}
              />
            </div>

            <Button
              full
              variant="primary"
              onClick={() => {
                upsertPlan({ ...planModal })
                pushAction(`Plan ${planModal.name} saved`, async () => {
                  await savePlan({ ...planModal })
                })
                setPlanModal(null)
              }}
            >
              Save Plan
            </Button>
          </div>
        ) : null}
      </Modal>

      <ToastHost />
    </div>
  )
}
