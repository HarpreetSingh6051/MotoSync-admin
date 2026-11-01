import { useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  FileText,
  Flag,
  Gauge,
  Megaphone,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Users,
  Volume2,
  Wifi,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar, Button, Modal, Panel, Pill, SectionHeading, Segmented, Toggle } from '@/components/ui'
import { GoldenHelmetBadge } from '@/components/brand/GoldenHelmetBadge'
import { Logo } from '@/components/ui'
import { ToastHost } from '@/components/ToastHost'
import { useAppStore } from '@/store/useAppStore'
import { useConfigStore } from '@/store/useConfigStore'
import { useAdminUsers } from '@/lib/adminData'
import { fetchPlatformConfig, logAdminAction, removeCampaign, removeFlag, removePlan, removeSound, saveCampaign, saveFlag, savePlan, saveSound, updateUserAdmin } from '@/lib/platformApi'
import { dataMode, supabase } from '@/lib/supabase'
import { navigate } from '@/lib/router'
import { currentUserId } from '@/lib/mockData'
import { cx, money } from '@/lib/format'
import type { AccountStatus, AdminRole, ExhaustSound, FeatureFlag, PlanAudience, PlanBadgeType, PlatformSnapshot, SponsoredCampaign, SubscriptionPlan } from '@/types'

type Tab = 'overview' | 'users' | 'plans' | 'flags' | 'sounds' | 'campaigns' | 'settings'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users / CRM', icon: Users },
  { id: 'plans', label: 'Plans', icon: Gauge },
  { id: 'flags', label: 'Feature flags', icon: Flag },
  { id: 'sounds', label: 'Exhaust vault', icon: Volume2 },
  { id: 'campaigns', label: 'Sponsored campaigns', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

const AdminFallback = () => (
  <div className="flex min-h-dvh items-center justify-center bg-ink-950">
    <div className="flex flex-col items-center gap-3">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-amber-300" />
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">Loading ERP</span>
    </div>
  </div>
)

export const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('overview')
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
  const [pulling, setPulling] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')

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
      pushToast('Sync skipped', 'No config returned from Supabase or not configured.', 'warn')
    }
    setPulling(false)
  }

  const userDetail = users.find((user) => user.id === userModal)

  return (
    <div className="min-h-dvh bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate('/feed')} className="flex items-center gap-2.5">
            <Logo compact />
            <div className="hidden sm:block">
              <p className="font-display text-sm font-black tracking-[0.08em] text-white">KIXUP</p>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">Super Admin ERP</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Pill tone={dataMode === 'live' ? 'live' : 'neutral'}>
              {dataMode === 'live' ? <><Wifi className="h-3 w-3" /> Live cloud</> : 'Demo mode'}
            </Pill>
            {lastSyncedAt ? (
              <span className="hidden text-[9px] text-white/30 sm:inline">Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>
            ) : null}
            <Button size="xs" variant="ghost" icon={<RefreshCw className={cx('h-3 w-3', pulling && 'animate-spin')} />} onClick={pullConfig} loading={pulling}>
              Pull from Supabase
            </Button>
            <Button size="xs" variant="ghost" onClick={() => navigate('/feed')}>Back to app</Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1">
            {tabs.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cx(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-medium transition',
                    active ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === 'overview' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total riders', value: users.length.toString(), icon: Users },
                { label: 'PRO subscribers', value: proUsers.length.toString(), icon: Sparkles },
                { label: 'Est. MRR (INR)', value: money(mrrInr), icon: BarChart3 },
                { label: 'Active campaigns', value: campaigns.filter(c=>c.isActive).length.toString(), icon: Megaphone },
              ].map((kpi) => (
                <Panel key={kpi.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-white/35">{kpi.label}</p>
                    <kpi.icon className="h-4 w-4 text-white/25" />
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{kpi.value}</p>
                </Panel>
              ))}
            </div>
            <Panel className="p-4 lg:row-span-2">
              <SectionHeading eyebrow="Sync" title="Live sync status" />
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-xs text-white/60">BroadcastChannel</span>
                  <span className="text-[10px] text-pack-400">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-xs text-white/60">Supabase realtime</span>
                  <span className="text-[10px] text-white/40">{supabase ? 'Configured' : 'Not configured'}</span>
                </div>
                <Button size="xs" variant="secondary" full onClick={resetConfig}>Reset demo config</Button>
              </div>
            </Panel>
            <Panel className="p-4 sm:p-5 lg:col-span-1 xl:col-span-3">
              <SectionHeading eyebrow="Revenue" title="Subscribers by plan" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {plans.sort((a,b)=>a.sortOrder-b.sortOrder).map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-1.5">
                      <GoldenHelmetBadge badgeType={plan.badgeType} size="xs" />
                      <p className="text-xs font-semibold text-white">{plan.name}</p>
                    </div>
                    <p className="mt-2 font-display text-lg font-bold text-white">{plan.subscribersCount}</p>
                    <p className="text-[9px] text-white/35">{money(plan.priceInr)} / mo</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ) : tab === 'users' ? (
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-4">
              <SectionHeading eyebrow="CRM" title="Riders & entitlements" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-white/40">
                  <tr>
                    <th className="px-4 py-2">Rider</th>
                    <th className="px-4 py-2">Plan</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">City</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {users.map((user) => {
                    const plan = plans.find((p) => p.id === user.planId)
                    return (
                      <tr key={user.id} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={user.fullName} accent={user.accent} size="xs" />
                            <div>
                              <p className="font-semibold text-white">{user.fullName}</p>
                              <p className="text-[9px] text-white/30">@{user.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-1.5">
                            <GoldenHelmetBadge badgeType={plan?.badgeType ?? (user.isPro ? 'golden_helmet' : 'none')} size="xs" />
                            <span className="text-white/60">{plan?.name ?? (user.isPro ? 'PRO' : 'Free')}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2 text-white/40">{user.role}</td>
                        <td className="px-4 py-2 text-white/40">{user.status}</td>
                        <td className="px-4 py-2 text-white/40">{user.city}</td>
                        <td className="px-4 py-2 text-right">
                          <Button size="xs" variant="ghost" onClick={() => setUserModal(user.id)}>Manage</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <Panel className="p-6 text-center">
            <p className="text-sm text-white/40">This tab is wired to the shared config store. Use the forms below to edit.</p>
          </Panel>
        )}
      </main>

      <Modal open={Boolean(userModal)} onClose={() => setUserModal(null)} title="Manage rider" subtitle={userDetail?.fullName}>
        {userDetail ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold text-white">{userDetail.fullName}</p>
              <p className="text-[10px] text-white/40">@{userDetail.handle} · {userDetail.city}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-xs text-white" defaultValue={userDetail.planId} onChange={(e) => setUserOverride(userDetail.id, { planId: e.target.value, isPro: e.target.value !== 'plan_free' })}>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-xs text-white" defaultValue={userDetail.role} onChange={(e) => setUserOverride(userDetail.id, { role: e.target.value as AdminRole })}>
                <option value="rider">rider</option>
                <option value="road_captain">road_captain</option>
                <option value="club_admin">club_admin</option>
                <option value="super_admin">super_admin</option>
              </select>
              <select className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-xs text-white" defaultValue={userDetail.status} onChange={(e) => setUserOverride(userDetail.id, { status: e.target.value as AccountStatus })}>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
                <option value="banned">banned</option>
              </select>
            </div>
            <Button full onClick={() => pushAction('User entitlement updated', async () => { await updateUserAdmin(userDetail.id, { subscriptionPlanId: useConfigStore.getState().overrides[userDetail.id]?.planId, role: useConfigStore.getState().overrides[userDetail.id]?.role, status: useConfigStore.getState().overrides[userDetail.id]?.status }); await logAdminAction(currentUserId, 'user.update', 'profile', userDetail.id, {}) })}>Save to cloud (if super admin)</Button>
          </div>
        ) : null}
      </Modal>

      <ToastHost />
    </div>
  )
}