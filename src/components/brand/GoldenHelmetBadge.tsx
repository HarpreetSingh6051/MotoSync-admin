import { useId, useState } from 'react'
import type { PlanBadgeType } from '@/types'
import { cx } from '@/lib/format'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-11 w-11',
}

const palettes: Record<
  Exclude<PlanBadgeType, 'none'>,
  { light: string; mid: string; dark: string; edge: string; visor: string; highlight: string; halo: string }
> = {
  golden_helmet: {
    light: '#FDE68A',
    mid: '#FBBF24',
    dark: '#B45309',
    edge: '#FCD34D',
    visor: '#0B3B4A',
    highlight: '#FFF7D6',
    halo: '#F59E0B',
  },
  silver_visor: {
    light: '#F8FAFC',
    mid: '#CBD5E1',
    dark: '#64748B',
    edge: '#E2E8F0',
    visor: '#0B2530',
    highlight: '#FFFFFF',
    halo: '#94A3B8',
  },
  club_shield: {
    light: '#DDD6FE',
    mid: '#A78BFA',
    dark: '#5B21B6',
    edge: '#C4B5FD',
    visor: '#180B2E',
    highlight: '#F5F3FF',
    halo: '#8B5CF6',
  },
}

/**
 * Kixup's PRO mark. Gold = Road Captain, silver = Silver Visor,
 * purple = Club Shield. Tap it to rev the visor.
 */
export const GoldenHelmetBadge = ({
  badgeType = 'golden_helmet',
  size = 'sm',
  className,
  onClick,
  title,
}: {
  badgeType?: PlanBadgeType
  size?: Size
  className?: string
  onClick?: () => void
  title?: string
}) => {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const [revKey, setRevKey] = useState(0)

  if (badgeType === 'none') return null

  const palette = palettes[badgeType]
  const label =
    title ??
    (badgeType === 'golden_helmet'
      ? 'Road Captain PRO'
      : badgeType === 'silver_visor'
        ? 'Silver Visor'
        : 'Club Shield')

  const handleClick = () => {
    setRevKey((value) => value + 1)
    onClick?.()
  }

  const content = (
    <span
      key={revKey}
      className={cx('inline-flex shrink-0 items-center justify-center', revKey > 0 && 'helmet-rev')}
    >
      <svg
        viewBox="0 0 48 48"
        role="img"
        aria-label={label}
        className="h-full w-full"
        style={{ filter: `drop-shadow(0 0 7px ${palette.halo}55)` }}
      >
        <defs>
          <linearGradient id={`shell-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="55%" stopColor={palette.mid} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>
          <linearGradient id={`visor-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#08080D" />
            <stop offset="100%" stopColor={palette.visor} />
          </linearGradient>
          <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="24" cy="24" r="22" fill={palette.halo} opacity="0.16" />
        <path
          d="M9 26.5C9 17.9 15.7 11 24 11s15 6.9 15 15.5v2.2c0 3.2-2.5 5.3-5.8 5.3H14.8C11.5 34 9 31.9 9 28.7v-2.2Z"
          fill={`url(#shell-${uid})`}
          stroke={palette.edge}
          strokeWidth="1.2"
        />
        <path
          d="M12.5 27.2h23c0 4.8-4.6 7.6-11.5 7.6s-11.5-2.8-11.5-7.6Z"
          fill={`url(#visor-${uid})`}
          stroke={palette.edge}
          strokeWidth="0.8"
        />
        <path
          d="M17 19.5c2-3.4 5-5.2 9-5.2"
          stroke={`url(#shine-${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M15 27.2h18"
          stroke={palette.highlight}
          strokeOpacity="0.45"
          strokeWidth="0.8"
        />
        <rect
          x="20.5"
          y="13.5"
          width="7"
          height="3.4"
          rx="1.7"
          fill={palette.dark}
          stroke={palette.edge}
          strokeWidth="0.6"
        />
        <path
          d="M24 11.5v3"
          stroke={palette.highlight}
          strokeWidth="0.8"
          strokeOpacity="0.7"
        />
        <circle cx="24" cy="31.2" r="1.2" fill={palette.highlight} opacity="0.7" />
        <path
          className="helmet-shimmer"
          d="M13 18c4-6 9-8 16-8"
          stroke="#FFFFFF"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )

  if (!onClick) {
    return (
      <span className={cx(sizeMap[size], 'inline-flex', className)} title={label}>
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={cx(
        sizeMap[size],
        'inline-flex items-center justify-center rounded-full transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60',
        className,
      )}
    >
      {content}
    </button>
  )
}
