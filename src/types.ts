export type Region = 'India' | 'Global'
export type RideStatus = 'upcoming' | 'ongoing' | 'completed'
export type Visibility = 'public' | 'group_only'
export type ClubPrivacy = 'public' | 'invite_only'
export type RsvpStatus = 'going' | 'maybe' | 'out'

export type FormationRole =
  | 'Road Captain'
  | 'Tail Sweep'
  | 'Medic / Toolkit'
  | 'Reel Creator'
  | 'Pack Member'

export type PingType = 'FUEL STOP' | 'CHAI BREAK' | 'HAZARD' | 'ALL CLEAR'

export type ScopeFilter = 'all' | 'near' | 'global'
export type PrivacyFilter = 'all' | 'public' | 'groups'

export interface LatLng {
  lat: number
  lng: number
}

export interface Profile {
  id: string
  handle: string
  fullName: string
  city: string
  country: string
  primaryBike: string
  bio: string
  isPro: boolean
  totalKm: number
  followers: number
  following: number
  accent: string
  avatarSeed: string
  /** true when the rider is currently out on a live ride */
  ridingNow?: boolean
  role?: AdminRole
  status?: AccountStatus
  subscriptionPlanId?: string
  selectedExhaustSound?: string
  phone?: string
  lastActiveAt?: string
}

export interface Club {
  id: string
  name: string
  handle: string
  description: string
  city: string
  region: Region
  ridingStyle: string
  badgeEmoji: string
  privacy: ClubPrivacy
  verified: boolean
  memberCount: number
  ridingNow: number
  accent: string
  createdBy: string
  memberIds: string[]
  founded: string
}

export interface Waypoint {
  label: string
  note?: string
  km: number
}

export interface Ride {
  id: string
  clubId: string
  captainId: string
  title: string
  routeSummary: string
  description: string
  regionScope: 'Near Me' | 'Global'
  distanceLabel: string
  distanceKm: number
  startTime: string
  meetupLabel: string
  meetupCoords: LatLng
  destinationCoords: LatLng
  visibility: Visibility
  status: RideStatus
  maxRiders: number
  splitEnabled: boolean
  likesCount: number
  commentCount: number
  hashtags: string[]
  waypoints: Waypoint[]
  participantIds: string[]
  art: ArtSeed
  difficulty: 'Chill' | 'Spirited' | 'Hardcore'
}

export interface ArtSeed {
  palette: 'sunset' | 'alpine' | 'coast' | 'desert' | 'night'
  seed: number
}

export interface Participant {
  rideId: string
  userId: string
  rsvpStatus: RsvpStatus
  formationRole: FormationRole
  currentSpeedKmh: number
  lastPingType?: PingType
  /** 0..1 progress along the route polyline */
  progress: number
  checkedIn: boolean
  gapKm: number
}

export interface Story {
  id: string
  userId: string
  rideId?: string
  label: string
  headline: string
  accent: string
  seen: boolean
  live: boolean
  audioDb: number
  postedAt: string
}

export type ChannelType = 'ride' | 'club' | 'dm'

export interface ChatChannel {
  id: string
  type: ChannelType
  title: string
  subtitle: string
  clubId?: string
  rideId?: string
  memberIds: string[]
  unread: number
  accent: string
  lastActive: string
}

export type MessageKind = 'text' | 'audio' | 'ping' | 'pin' | 'system'

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  text: string
  kind: MessageKind
  audioDb?: number
  durationSec?: number
  createdAt: string
  mine?: boolean
}

export interface ExpenseLineItem {
  label: string
  qty: number
  price: number
}

export interface Expense {
  id: string
  rideId: string
  paidByUserId: string
  title: string
  amount: number
  currency: 'INR' | 'USD'
  perRiderShare: number
  splitCount: number
  lineItems: ExpenseLineItem[]
  receiptImageUrl?: string
  createdAt: string
}

export interface ServiceItem {
  id: string
  label: string
  detail: string
  dueInKm: number
  totalKm: number
  icon: 'oil' | 'chain' | 'tyre' | 'brake' | 'battery'
}

export interface GarageBike {
  model: string
  year: number
  odometerKm: number
  plate: string
  tyreFront: number
  tyreRear: number
  tyreUnit: 'psi'
  service: ServiceItem[]
}

export interface PingEvent {
  id: string
  rideId: string
  userId: string
  type: PingType
  createdAt: string
}

export interface LiveRiderState {
  userId: string
  formationRole: FormationRole
  progress: number
  speedKmh: number
  gapKm: number
  coords: LatLng
  lastPingType?: PingType
  isLead: boolean
}

export interface ReelClip {
  id: string
  label: string
  durationSec: number
  palette: ArtSeed['palette']
  seed: number
  kind: 'video' | 'photo' | 'audio'
}

export type ToastTone = 'default' | 'success' | 'warn' | 'danger'

export interface Toast {
  id: string
  message: string
  description?: string
  tone: ToastTone
}

/* ------------------------------------------------------------------ *
 * Phase 2 — shared platform config (Super Admin ERP ↔ rider app)
 * ------------------------------------------------------------------ */

export type PlanBadgeType = 'none' | 'silver_visor' | 'golden_helmet' | 'club_shield'
export type BillingInterval = 'monthly' | 'annual' | 'lifetime'
export type PlanAudience = 'rider' | 'club'

export interface PlanLimits {
  aiScansPerMonth: number
  reelQuality: '720p' | '1080p' | '4K'
  watermark: boolean
  offlineGpx: boolean
  familyLinks: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  tagline: string
  badgeType: PlanBadgeType
  audience: PlanAudience
  priceInr: number
  priceUsd: number
  billingInterval: BillingInterval
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  features: string[]
  limits: PlanLimits
  subscribersCount: number
}

export type FeatureCategory = 'core' | 'ai' | 'monetization' | 'experimental' | 'safety'
export type FeatureAccess = 'all' | 'pro_only' | 'club_admins' | 'beta_testers'

export interface FeatureFlag {
  key: string
  name: string
  description: string
  category: FeatureCategory
  isEnabled: boolean
  accessLevel: FeatureAccess
  rolloutPercentage: number
}

export type ExhaustPreset =
  | 'harley_vtwin'
  | 'bullet_thump'
  | 'ninja_inline4'
  | 'ducati_v4'
  | 'triumph_triple'

export interface ExhaustSound {
  id: string
  name: string
  brand: string
  engineConfiguration: string
  decibels: number
  audioUrl?: string
  synthPreset: ExhaustPreset
  isProOnly: boolean
  isActive: boolean
  sortOrder: number
}

export type CampaignRegion = 'India' | 'Global' | 'All'

export interface SponsoredCampaign {
  id: string
  sponsorName: string
  title: string
  perkOffer: string
  region: CampaignRegion
  ctaUrl?: string
  cpmRateUsd: number
  impressions: number
  clicks: number
  isActive: boolean
}

export type AdminRole = 'rider' | 'road_captain' | 'club_admin' | 'super_admin'
export type AccountStatus = 'active' | 'suspended' | 'banned'

export interface UserOverride {
  planId?: string
  isPro?: boolean
  role?: AdminRole
  status?: AccountStatus
}

export interface PlatformSnapshot {
  plans: SubscriptionPlan[]
  flags: FeatureFlag[]
  sounds: ExhaustSound[]
  campaigns: SponsoredCampaign[]
}
