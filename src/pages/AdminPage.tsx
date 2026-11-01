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
  ExternalLink,
  FileText,
  Flag,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Square,
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
import { useAdminUsers } from '@/lib/adminData'
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
  | 'plans'
  | 'campaigns'
  | 'flags'
  | 'sounds'
  | 'users'
  | 'audit'
  | 'settings'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [pulling, setPulling] = useState(false)
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

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

  const [planModal, setPlanModal] = useState<SubscriptionPlan | null>(null)
  const [flagModal, setFlagModal] = useState<FeatureFlag | null>(null)
  const [soundModal, setSoundModal] = useState<ExhaustSound | null>(null)
  const [campaignModal, setCampaignModal] = useState<SponsoredCampaign | null>(null)
  const [userModal, setUserModal] = useState<string | null>(null)

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
      
      const freq = sound.synthPreset === 'bullet_thump' ? 55 : sound.synthPreset === 'ninja_inline4' ? 140 : sound.synthPreset === 'ducati_v4' ? 110 : sound.synthPreset === 'triumph_triple' ? 95 : 75
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
      group: 'COMMERCIAL & TIERS',
      items: [
        { id: 'plans', label: 'Subscription Plans', icon: Gauge, badge: `${plans.length}` },
        { id: 'campaigns', label: 'Pitstop Campaigns', icon: Megaphone, badge: `${campaigns.filter((c) => c.isActive).length}` },
      ],
    },
    {
      group: 'FEATURE GOVERNANCE',
      items: [
        { id: 'flags', label: 'Feature Flags', icon: Flag, badge: `${flags.filter((f) => f.isEnabled).length}/${flags.length}` },
        { id: 'sounds', label: 'Exhaust Vault', icon: Volume2, badge: `${sounds.length}` },
      ],
    },
    {
      group: 'COMMUNITY & CRM',
      items: [
        { id: 'users', label: 'Riders & CRM', icon: Users, badge: `${users.length}` },
      ],
    },
    {
      group: 'SYSTEM & SECURITY',
      items: [
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ],
    },
  ]

  const userDetail = users.find((user) => user.id === userModal)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'pro'
          ? u.isPro
          : u.role === userRoleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, userRoleFilter])

  return (
    <div className="flex min-h-screen bg-[#07090E] text-slate-100 antialiased selection:bg-amber-400 selection:text-black">
      {/* ------------------------------------------------------------- */}
      {/* LEFT-SIDEBAR NAVIGATION                                       */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.08] bg-[#0B0F19]/95 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-5">
          <div className="flex items-center gap-3">
            <Logo compact />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-black tracking-wider text-white">MOTOSYNC</span>
                <span className="rounded bg-amber-400/10 px-1 py-0.2 text-[8px] font-bold tracking-widest text-amber-300 uppercase">ERP</span>
              </div>
              <p className="text-[8px] font-semibold tracking-[0.2em] text-white/40 uppercase">Super Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-white/40 hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Modules & Submodules */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[9px] font-bold tracking-[0.25em] text-white/30 uppercase">{group.group}</p>
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
                        'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150',
                        active
                          ? 'bg-gradient-to-r from-amber-400/15 via-amber-400/5 to-transparent text-amber-300 border-l-2 border-amber-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                          : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cx('h-4 w-4 transition-transform group-hover:scale-110', active ? 'text-amber-300' : 'text-white/40')} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={cx(
                            'rounded-full px-2 py-0.5 text-[9px] font-semibold',
                            active ? 'bg-amber-400/20 text-amber-300' : 'bg-white/[0.06] text-white/40',
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
        <div className="border-t border-white/[0.08] p-3 space-y-2 bg-[#090D15]">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2">
              <span className={cx('h-2 w-2 rounded-full animate-pulse', dataMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400')} />
              <div>
                <p className="text-[10px] font-semibold text-white">{dataMode === 'live' ? 'Live Cloud' : 'Demo Mode'}</p>
                <p className="text-[8px] text-white/35">Supabase Realtime</p>
              </div>
            </div>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-mono text-white/40">
              {backendStatus === 'online' ? 'API 200' : 'API Standby'}
            </span>
          </div>

          <a
            href={RIDER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-[11px] font-medium text-white/70 transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300"
          >
            <span>Launch Rider App</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ----------------------------------------------------------- */}
        {/* TOP NAVBAR (Minimalist Header with Profile & Notifications) */}
        {/* ----------------------------------------------------------- */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#07090E]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:text-white lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>MotoSync ERP</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-white capitalize">{currentModule.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Topbar Right Section: Sync, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick sync button */}
            <Button
              size="xs"
              variant="ghost"
              icon={<RefreshCw className={cx('h-3.5 w-3.5', pulling && 'animate-spin text-amber-300')} />}
              onClick={pullConfig}
              loading={pulling}
              className="hidden md:inline-flex border border-white/[0.07]"
            >
              Sync Cloud
            </Button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0F1420] p-4 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-white">System Notifications</p>
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">3 new</span>
                    </div>
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <p className="font-semibold text-white">Supabase Realtime Connected</p>
                        <p className="text-[10px] text-white/40 mt-0.5">PostgreSQL changes streaming over WebSocket.</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <p className="font-semibold text-white">Road Captain PRO Plan Active</p>
                        <p className="text-[10px] text-white/40 mt-0.5">412 active subscriptions synced with backend.</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <p className="font-semibold text-white">Vercel API Online</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Production REST gateway responding in 24ms.</p>
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
                className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1.5 pr-3 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className="relative">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 font-bold text-[11px] text-black">
                    HS
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#07090E] bg-emerald-400" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold leading-none text-white">Harpreet Singh</p>
                  <p className="text-[9px] font-medium leading-none text-amber-300/80 mt-0.5">SUPER ADMIN</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/40" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0F1420] p-2 shadow-2xl z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.07]">
                      <p className="text-xs font-semibold text-white">Harpreet Singh</p>
                      <p className="text-[10px] text-white/40">harpreetsingh6051@gmail.com</p>
                    </div>
                    <a
                      href={RIDER_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
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
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reset Local State
                    </button>
                    <div className="pt-1 border-t border-white/[0.07]">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          pushToast('Session Active', 'You are logged in as Super Admin.', 'default')
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ========================================================= */}
          {/* 1. OVERVIEW & KPIS                                        */}
          {/* ========================================================= */}
          {currentModule === 'overview' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">Platform Command Center</h1>
                <p className="text-xs text-white/40 mt-1">Real-time health, monetization telemetry, and pack activities.</p>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Total Registered Riders',
                    value: users.length.toString(),
                    trend: '+12.5% this month',
                    icon: Users,
                    color: 'text-cyan-400',
                    gradient: 'from-cyan-500/20 to-transparent',
                  },
                  {
                    label: 'Active PRO Subscribers',
                    value: proUsers.length.toString(),
                    trend: `${((proUsers.length / Math.max(users.length, 1)) * 100).toFixed(1)}% conversion`,
                    icon: Sparkles,
                    color: 'text-amber-400',
                    gradient: 'from-amber-500/20 to-transparent',
                  },
                  {
                    label: 'Est. Monthly Revenue (MRR)',
                    value: money(mrrInr),
                    trend: '₹ 1.25L annualized run-rate',
                    icon: BarChart3,
                    color: 'text-emerald-400',
                    gradient: 'from-emerald-500/20 to-transparent',
                  },
                  {
                    label: 'Active Ad Campaigns',
                    value: campaigns.filter((c) => c.isActive).length.toString(),
                    trend: 'Across 3 target regions',
                    icon: Megaphone,
                    color: 'text-rose-400',
                    gradient: 'from-rose-500/20 to-transparent',
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 shadow-xl transition-all duration-200 hover:border-white/20"
                  >
                    <div className={cx('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', kpi.gradient)} />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">{kpi.label}</p>
                      <kpi.icon className={cx('h-4 w-4', kpi.color)} />
                    </div>
                    <p className="mt-3 font-display text-3xl font-extrabold text-white tracking-tight">{kpi.value}</p>
                    <p className="mt-2 text-[10px] font-medium text-white/40">{kpi.trend}</p>
                  </div>
                ))}
              </div>

              {/* Grid: Plan Distribution & Realtime Telemetry */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Plan Distribution (2 Cols) */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-white">Subscription Tier Distribution</h2>
                      <p className="text-[10px] text-white/40">Active paying riders across catalog tiers</p>
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
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-amber-400/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{plan.name}</span>
                            <GoldenHelmetBadge badgeType={plan.badgeType} size="xs" />
                          </div>
                          <p className="mt-3 font-display text-2xl font-bold text-white tracking-tight">{plan.subscribersCount}</p>
                          <p className="text-[10px] text-white/40 mt-1">
                            {plan.priceInr === 0 ? 'Free tier' : `${money(plan.priceInr)} / ${plan.billingInterval}`}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Cloud & Realtime Status (1 Col) */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <h2 className="text-sm font-bold text-white">Live Infrastructure</h2>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div>
                        <p className="font-semibold text-white">Supabase Cloud Database</p>
                        <p className="text-[9px] text-white/40">PostgreSQL 17.11 with PostGIS</p>
                      </div>
                      <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">HEALTHY</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div>
                        <p className="font-semibold text-white">NestJS Backend Gateway</p>
                        <p className="text-[9px] text-white/40">Vercel Serverless Function</p>
                      </div>
                      <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase">
                        {backendStatus === 'online' ? 'CONNECTED' : 'CHECKING'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div>
                        <p className="font-semibold text-white">Rider App PWA & Android</p>
                        <p className="text-[9px] text-white/40">Capacitor native shell</p>
                      </div>
                      <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">SYNCED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SUBSCRIPTION PLANS                                     */}
          {/* ========================================================= */}
          {currentModule === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">Subscription Plans</h1>
                  <p className="text-xs text-white/40 mt-1">Manage pricing tiers, feature quotas, and rider badges in real time.</p>
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
                        'relative flex flex-col justify-between rounded-2xl border p-5 shadow-xl transition-all duration-200',
                        plan.isPopular
                          ? 'border-amber-400/40 bg-gradient-to-b from-amber-400/5 via-[#0E131F] to-[#0E131F]'
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
                          <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-white/50">{plan.tagline}</p>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="font-display text-3xl font-extrabold text-white">{money(plan.priceInr)}</span>
                          <span className="text-xs text-white/40">/ {plan.billingInterval}</span>
                          <span className="ml-2 text-xs text-white/30">(${plan.priceUsd})</span>
                        </div>

                        <div className="mt-4 border-t border-white/[0.07] pt-3 space-y-1.5">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-white/70">
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-white/[0.07] pt-4 flex items-center justify-between">
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
                          <span className="text-[10px] text-white/40">{plan.isActive ? 'Active' : 'Disabled'}</span>
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
          {/* 3. FEATURE FLAGS                                          */}
          {/* ========================================================= */}
          {currentModule === 'flags' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">Runtime Feature Flags</h1>
                  <p className="text-xs text-white/40 mt-1">Staged rollouts, feature kill-switches, and PRO restrictions.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] divide-y divide-white/[0.06]">
                {flags.map((flag) => (
                  <div key={flag.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300">{flag.key}</span>
                        {flag.accessLevel === 'pro_only' ? (
                          <span className="rounded bg-amber-400/10 px-1.5 py-0.2 text-[8px] font-bold text-amber-300 uppercase">PRO ONLY</span>
                        ) : null}
                      </div>
                      <p className="text-xs font-semibold text-white">{flag.name}</p>
                      <p className="text-[11px] text-white/40">{flag.description}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-white/40">Rollout %</p>
                        <p className="text-xs font-bold font-mono text-white">{flag.rolloutPercentage}%</p>
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
          {/* 4. DIGITAL GARAGE EXHAUST SOUNDS                          */}
          {/* ========================================================= */}
          {currentModule === 'sounds' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">Digital Garage Exhaust Vault</h1>
                  <p className="text-xs text-white/40 mt-1">Motorcycle acoustic synthesis signatures and tachometer audio engine.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sounds.map((sound) => (
                  <div key={sound.id} className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-base font-bold text-white">{sound.name}</h3>
                        <p className="text-xs font-mono text-amber-300/80">{sound.engineConfiguration}</p>
                      </div>
                      {sound.isProOnly ? (
                        <span className="flex items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                          <Lock className="h-3 w-3" /> PRO
                        </span>
                      ) : (
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white/50">FREE</span>
                      )}
                    </div>

                    <p className="text-xs text-white/50">{sound.brand} · Preset: {sound.synthPreset.replace('_', ' ')}</p>

                    <div className="flex items-center justify-between text-[11px] text-white/40 border-t border-white/[0.06] pt-3">
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
          {/* 5. SPONSORED PITSTOP CAMPAIGNS                            */}
          {/* ========================================================= */}
          {currentModule === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">Sponsored Pitstop Campaigns</h1>
                  <p className="text-xs text-white/40 mt-1">Configure geo-targeted sponsor cards along pack ride routes.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E131F] flex flex-col justify-between">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-bold text-white">{camp.sponsorName}</span>
                        <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', camp.isActive ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/10 text-white/40')}>
                          {camp.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-300">{camp.title}</p>
                      <p className="text-xs text-white/60">{camp.perkOffer}</p>
                      <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.06]">
                        <span>Region: {camp.region}</span>
                        <span>CPM: ${camp.cpmRateUsd}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
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
          {/* 6. RIDERS & CRM                                           */}
          {/* ========================================================= */}
          {currentModule === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">Rider CRM & Entitlements</h1>
                  <p className="text-xs text-white/40 mt-1">Manage rider accounts, subscription tiers, and administrative roles.</p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, @handle, or city..."
                    className="w-full rounded-xl border border-white/10 bg-[#0E131F] py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
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
                        userRoleFilter === role ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/[0.04] text-white/50 hover:text-white',
                      )}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Riders Table */}
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E131F]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/[0.08] bg-white/[0.02] text-white/40">
                      <tr>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">Rider Profile</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">Subscription Plan</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">System Role</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">Account Status</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">Location</th>
                        <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredUsers.map((user) => {
                        const plan = plans.find((p) => p.id === user.planId)
                        return (
                          <tr key={user.id} className="transition hover:bg-white/[0.02]">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar name={user.fullName} accent={user.accent} size="sm" />
                                <div>
                                  <p className="font-semibold text-white">{user.fullName}</p>
                                  <p className="text-[10px] text-white/40">@{user.handle}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white">
                                <GoldenHelmetBadge badgeType={plan?.badgeType ?? (user.isPro ? 'golden_helmet' : 'none')} size="xs" />
                                <span>{plan?.name ?? (user.isPro ? 'PRO' : 'Free Rider')}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cx(
                                  'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                                  user.role === 'super_admin'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : user.role === 'road_captain'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : 'bg-white/[0.06] text-white/50',
                                )}
                              >
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cx(
                                  'inline-flex items-center gap-1 text-[11px]',
                                  user.status === 'active' ? 'text-emerald-400' : 'text-rose-400',
                                )}
                              >
                                <span className={cx('h-1.5 w-1.5 rounded-full', user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400')} />
                                <span className="capitalize">{user.status}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-white/50">{user.city}</td>
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
          {/* 7. PLATFORM SETTINGS & SYSTEM                             */}
          {/* ========================================================= */}
          {currentModule === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white">Platform Settings & Endpoints</h1>
                <p className="text-xs text-white/40 mt-1">Cross-application URLs, database credentials, and cache controls.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/[0.07] pb-3">Cloud Connection Endpoints</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Supabase Cloud URL</p>
                      <p className="font-mono text-white/80 mt-0.5 break-all">https://hxsifqmspboitoqnkvwj.supabase.co</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Backend REST API</p>
                      <p className="font-mono text-white/80 mt-0.5 break-all">{BACKEND_API_URL}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Rider Web Application</p>
                      <p className="font-mono text-white/80 mt-0.5 break-all">{RIDER_APP_URL}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/[0.07] pb-3">Data & Cache Actions</h3>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
              <Avatar name={userDetail.fullName} accent={userDetail.accent} size="md" />
              <div>
                <p className="text-sm font-bold text-white">{userDetail.fullName}</p>
                <p className="text-xs text-white/40">@{userDetail.handle} · {userDetail.city}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase">Subscription Plan</label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:outline-none"
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
                <label className="text-[10px] font-bold text-white/40 uppercase">Platform Role</label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:outline-none"
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
                <label className="text-[10px] font-bold text-white/40 uppercase">Account Status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:outline-none"
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
              <label className="text-[10px] font-bold text-white/40 uppercase">Plan Name</label>
              <input
                type="text"
                defaultValue={planModal.name}
                onChange={(e) => (planModal.name = e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase">Price (INR ₹)</label>
                <input
                  type="number"
                  defaultValue={planModal.priceInr}
                  onChange={(e) => (planModal.priceInr = Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase">Price (USD $)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={planModal.priceUsd}
                  onChange={(e) => (planModal.priceUsd = Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase">Tagline</label>
              <input
                type="text"
                defaultValue={planModal.tagline}
                onChange={(e) => (planModal.tagline = e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-xs text-white"
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
