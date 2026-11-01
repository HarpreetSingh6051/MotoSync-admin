import type {
  AccountStatus,
  AdminRole,
  BillingInterval,
  CampaignRegion,
  ExhaustPreset,
  ExhaustSound,
  FeatureAccess,
  FeatureCategory,
  FeatureFlag,
  PlanAudience,
  PlanBadgeType,
  PlanLimits,
  PlatformSnapshot,
  SponsoredCampaign,
  SubscriptionPlan,
} from '@/types'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ *
 * Row mappers
 * ------------------------------------------------------------------ */

type Row = Record<string, unknown>

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback

const num = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const bool = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback

const stringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const asBadge = (value: unknown): PlanBadgeType =>
  value === 'silver_visor' || value === 'golden_helmet' || value === 'club_shield'
    ? value
    : 'none'

const asInterval = (value: unknown): BillingInterval =>
  value === 'annual' || value === 'lifetime' ? value : 'monthly'

const asAudience = (value: unknown): PlanAudience => (value === 'club' ? 'club' : 'rider')

const asCategory = (value: unknown): FeatureCategory =>
  value === 'ai' ||
  value === 'monetization' ||
  value === 'experimental' ||
  value === 'safety'
    ? value
    : 'core'

const asAccess = (value: unknown): FeatureAccess =>
  value === 'pro_only' || value === 'club_admins' || value === 'beta_testers'
    ? value
    : 'all'

const asRegion = (value: unknown): CampaignRegion =>
  value === 'India' || value === 'Global' ? value : 'All'

const asPreset = (value: unknown): ExhaustPreset =>
  value === 'bullet_thump' ||
  value === 'ninja_inline4' ||
  value === 'ducati_v4' ||
  value === 'triumph_triple'
    ? value
    : 'harley_vtwin'

const asLimits = (value: unknown): PlanLimits => {
  const source = value && typeof value === 'object' ? (value as Row) : {}
  const quality = str(source.reelQuality, '1080p')
  return {
    aiScansPerMonth: num(source.aiScansPerMonth, 2),
    reelQuality: quality === '4K' || quality === '720p' ? quality : '1080p',
    watermark: bool(source.watermark, true),
    offlineGpx: bool(source.offlineGpx, false),
    familyLinks: bool(source.familyLinks, false),
  }
}

const mapPlan = (row: Row): SubscriptionPlan => ({
  id: str(row.id),
  name: str(row.name, 'Untitled plan'),
  tagline: str(row.tagline),
  badgeType: asBadge(row.badge_type),
  audience: asAudience(row.audience),
  priceInr: num(row.price_inr),
  priceUsd: num(row.price_usd),
  billingInterval: asInterval(row.billing_interval),
  isPopular: bool(row.is_popular),
  isActive: bool(row.is_active, true),
  sortOrder: num(row.sort_order),
  features: stringArray(row.features),
  limits: asLimits(row.limits),
  subscribersCount: num(row.subscribers_count),
})

const mapFlag = (row: Row): FeatureFlag => ({
  key: str(row.key),
  name: str(row.name, 'Untitled flag'),
  description: str(row.description),
  category: asCategory(row.category),
  isEnabled: bool(row.is_enabled, true),
  accessLevel: asAccess(row.access_level),
  rolloutPercentage: Math.min(100, Math.max(0, num(row.rollout_percentage, 100))),
})

const mapSound = (row: Row): ExhaustSound => ({
  id: str(row.id),
  name: str(row.name, 'Untitled sound'),
  brand: str(row.brand),
  engineConfiguration: str(row.engine_configuration),
  decibels: num(row.decibels, 98),
  audioUrl: str(row.audio_url) || undefined,
  synthPreset: asPreset(row.synth_preset),
  isProOnly: bool(row.is_pro_only),
  isActive: bool(row.is_active, true),
  sortOrder: num(row.sort_order),
})

const mapCampaign = (row: Row): SponsoredCampaign => ({
  id: str(row.id),
  sponsorName: str(row.sponsor_name),
  title: str(row.title),
  perkOffer: str(row.perk_offer),
  region: asRegion(row.region),
  ctaUrl: str(row.cta_url) || undefined,
  cpmRateUsd: num(row.cpm_rate_usd),
  impressions: num(row.impressions),
  clicks: num(row.clicks),
  isActive: bool(row.is_active, true),
})

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export const fetchPlatformConfig = async (): Promise<PlatformSnapshot | null> => {
  const client = supabase
  if (!client) return null

  try {
    const [plans, flags, sounds, campaigns] = await Promise.all([
      client.from('subscription_plans').select('*').order('sort_order', { ascending: true }),
      client.from('app_feature_flags').select('*').order('name', { ascending: true }),
      client.from('exhaust_sounds').select('*').order('sort_order', { ascending: true }),
      client.from('sponsored_campaigns').select('*').order('created_at', { ascending: false }),
    ])

    if (plans.error || flags.error || sounds.error || campaigns.error) return null

    const planRows = (plans.data ?? []) as Row[]
    const flagRows = (flags.data ?? []) as Row[]
    const soundRows = (sounds.data ?? []) as Row[]
    const campaignRows = (campaigns.data ?? []) as Row[]

    if (!planRows.length && !flagRows.length && !soundRows.length && !campaignRows.length) {
      return null
    }

    return {
      plans: planRows.map(mapPlan),
      flags: flagRows.map(mapFlag),
      sounds: soundRows.map(mapSound),
      campaigns: campaignRows.map(mapCampaign),
    }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ *
 * Writes (optimistic locally; these throw if the cloud write fails)
 * ------------------------------------------------------------------ */

const clientOrThrow = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

const toPlanRow = (plan: SubscriptionPlan) => ({
  id: plan.id,
  name: plan.name,
  tagline: plan.tagline,
  badge_type: plan.badgeType,
  audience: plan.audience,
  price_inr: plan.priceInr,
  price_usd: plan.priceUsd,
  billing_interval: plan.billingInterval,
  is_popular: plan.isPopular,
  is_active: plan.isActive,
  sort_order: plan.sortOrder,
  features: plan.features,
  limits: plan.limits,
  subscribers_count: plan.subscribersCount,
})

const toFlagRow = (flag: FeatureFlag) => ({
  key: flag.key,
  name: flag.name,
  description: flag.description,
  category: flag.category,
  is_enabled: flag.isEnabled,
  access_level: flag.accessLevel,
  rollout_percentage: flag.rolloutPercentage,
})

const toSoundRow = (sound: ExhaustSound) => ({
  id: sound.id,
  name: sound.name,
  brand: sound.brand,
  engine_configuration: sound.engineConfiguration,
  decibels: sound.decibels,
  audio_url: sound.audioUrl ?? null,
  synth_preset: sound.synthPreset,
  is_pro_only: sound.isProOnly,
  is_active: sound.isActive,
  sort_order: sound.sortOrder,
})

const toCampaignRow = (campaign: SponsoredCampaign) => ({
  id: campaign.id,
  sponsor_name: campaign.sponsorName,
  title: campaign.title,
  perk_offer: campaign.perkOffer,
  region: campaign.region,
  cta_url: campaign.ctaUrl ?? null,
  cpm_rate_usd: campaign.cpmRateUsd,
  impressions: campaign.impressions,
  clicks: campaign.clicks,
  is_active: campaign.isActive,
})

export const savePlan = async (plan: SubscriptionPlan) => {
  const { error } = await clientOrThrow()
    .from('subscription_plans')
    .upsert(toPlanRow(plan), { onConflict: 'id' })
  if (error) throw error
}

export const removePlan = async (id: string) => {
  const { error } = await clientOrThrow().from('subscription_plans').delete().eq('id', id)
  if (error) throw error
}

export const saveFlag = async (flag: FeatureFlag) => {
  const { error } = await clientOrThrow()
    .from('app_feature_flags')
    .upsert(toFlagRow(flag), { onConflict: 'key' })
  if (error) throw error
}

export const removeFlag = async (key: string) => {
  const { error } = await clientOrThrow().from('app_feature_flags').delete().eq('key', key)
  if (error) throw error
}

export const saveSound = async (sound: ExhaustSound) => {
  const { error } = await clientOrThrow()
    .from('exhaust_sounds')
    .upsert(toSoundRow(sound), { onConflict: 'id' })
  if (error) throw error
}

export const removeSound = async (id: string) => {
  const { error } = await clientOrThrow().from('exhaust_sounds').delete().eq('id', id)
  if (error) throw error
}

export const saveCampaign = async (campaign: SponsoredCampaign) => {
  const { error } = await clientOrThrow()
    .from('sponsored_campaigns')
    .upsert(toCampaignRow(campaign), { onConflict: 'id' })
  if (error) throw error
}

export const removeCampaign = async (id: string) => {
  const { error } = await clientOrThrow().from('sponsored_campaigns').delete().eq('id', id)
  if (error) throw error
}

export interface AdminUserPatch {
  role?: AdminRole
  status?: AccountStatus
  subscriptionPlanId?: string
  isPro?: boolean
}

export const updateUserAdmin = async (userId: string, patch: AdminUserPatch) => {
  const row: Record<string, unknown> = {}
  if (patch.role) row.role = patch.role
  if (patch.status) row.status = patch.status
  if (patch.subscriptionPlanId) row.subscription_plan_id = patch.subscriptionPlanId
  if (typeof patch.isPro === 'boolean') row.is_pro = patch.isPro
  if (!Object.keys(row).length) return

  const { error } = await clientOrThrow().from('profiles').update(row).eq('id', userId)
  if (error) throw error
}

export const logAdminAction = async (
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  payload: Record<string, unknown> = {},
) => {
  const client = supabase
  if (!client) return
  try {
    await client.from('admin_audit_log').insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      payload,
    })
  } catch {
    /* audit logging must never block an admin action */
  }
}
