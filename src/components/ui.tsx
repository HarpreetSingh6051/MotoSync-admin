import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, Check, ChevronRight, Loader2, X } from 'lucide-react'
import { cx, hashCode, initials } from '@/lib/format'

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'cyan' | 'danger' | 'success'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  trailingIcon?: ReactNode
  full?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-crimson-500 to-rose-500 text-white shadow-[0_10px_30px_-12px_rgba(244,63,94,0.9)] hover:from-crimson-400 hover:to-rose-400 active:scale-[0.985]',
  secondary:
    'border border-white/12 bg-white/[0.06] text-white hover:border-white/25 hover:bg-white/[0.1] active:scale-[0.985]',
  ghost: 'text-white/65 hover:bg-white/[0.07] hover:text-white',
  cyan:
    'bg-gradient-to-r from-cyber-400 to-sky-400 text-ink-950 font-semibold shadow-[0_10px_30px_-12px_rgba(34,211,238,0.9)] hover:from-cyber-300 hover:to-sky-300 active:scale-[0.985]',
  danger:
    'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_10px_30px_-12px_rgba(225,29,72,0.9)] hover:from-rose-500',
  success:
    'bg-gradient-to-r from-pack-600 to-emerald-500 text-ink-950 font-semibold shadow-[0_10px_30px_-12px_rgba(16,185,129,0.9)] hover:from-pack-500',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-[11px] gap-1.5 rounded-xl',
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-13 px-6 text-sm gap-2.5 rounded-2xl',
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  trailingIcon,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cx(
      'inline-flex select-none items-center justify-center font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant],
      sizes[size],
      full && 'w-full',
      className,
    )}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
    {trailingIcon}
  </button>
)

export const IconButton = ({
  className,
  children,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button
    {...rest}
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.1] hover:text-white active:scale-95',
      className,
    )}
  >
    {children}
  </button>
)

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export const Panel = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cx('card', className)}>
    {children}
  </div>
)

export const SectionHeading = ({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
  className?: string
}) => (
  <div className={cx('flex items-end justify-between gap-3', className)}>
    <div>
      {eyebrow ? <p className="label mb-1">{eyebrow}</p> : null}
      <h2 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
        {title}
      </h2>
    </div>
    {action}
  </div>
)

/* ------------------------------------------------------------------ */
/* Avatars                                                             */
/* ------------------------------------------------------------------ */

const avatarSizes = {
  xs: 'h-7 w-7 text-[9px]',
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-11 w-11 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-20 w-20 text-lg',
  '2xl': 'h-28 w-28 text-2xl',
} as const

export const Avatar = ({
  name,
  accent = '#F43F5E',
  size = 'md',
  ring = false,
  live = false,
  className,
  onClick,
}: {
  name: string
  accent?: string
  size?: keyof typeof avatarSizes
  ring?: boolean
  live?: boolean
  className?: string
  onClick?: () => void
}) => {
  const seed = hashCode(name)
  const angle = seed % 360
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        avatarSizes[size],
        ring && 'ring-2 ring-white/20 ring-offset-2 ring-offset-ink-950',
        className,
      )}
      style={{
        background: `linear-gradient(${angle}deg, ${accent}, #1b1b2b 130%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.16)`,
      }}
      title={name}
    >
      <span className="drop-shadow-sm">{initials(name)}</span>
      {live ? (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pack-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-ink-950 bg-pack-400" />
        </span>
      ) : null}
    </Tag>
  )
}

export const AvatarStack = ({
  people,
  max = 4,
  size = 'sm',
}: {
  people: Array<{ id: string; fullName: string; accent: string }>
  max?: number
  size?: keyof typeof avatarSizes
}) => {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((person, index) => (
        <div
          key={person.id}
          className={cx('rounded-full ring-2 ring-ink-950', index > 0 && '-ml-2.5')}
        >
          <Avatar name={person.fullName} accent={person.accent} size={size} />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className={cx(
            '-ml-2.5 inline-flex items-center justify-center rounded-full border border-white/10 bg-ink-700 text-[10px] font-semibold text-white/80 ring-2 ring-ink-950',
            avatarSizes[size],
          )}
        >
          +{extra}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small atoms                                                         */
/* ------------------------------------------------------------------ */

export const Pill = ({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'live' | 'crimson' | 'cyan' | 'amber' | 'violet'
  className?: string
}) => {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.05] text-white/65',
    live: 'border-pack-500/30 bg-pack-500/12 text-pack-400',
    crimson: 'border-crimson-500/30 bg-crimson-500/12 text-crimson-400',
    cyan: 'border-cyber-400/30 bg-cyber-400/12 text-cyber-300',
    amber: 'border-amber-400/30 bg-amber-400/12 text-amber-300',
    violet: 'border-violet-400/30 bg-violet-400/12 text-violet-300',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const LiveDot = ({ className }: { className?: string }) => (
  <span className={cx('relative flex h-2 w-2', className)}>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pack-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-pack-400" />
  </span>
)

export const Verified = ({ className }: { className?: string }) => (
  <BadgeCheck className={cx('h-4 w-4 shrink-0 text-cyber-400', className)} />
)

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}) => (
  <div className={cx('flex items-start justify-between gap-4', className)}>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-800 dark:text-white transition-colors">{label}</p>
      {description ? (
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-white/50 transition-colors">
          {description}
        </p>
      ) : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40',
        checked
          ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
          : 'bg-slate-300 dark:bg-white/20',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  </div>
)

export const ProgressBar = ({
  value,
  tone = 'crimson',
  className,
}: {
  value: number
  tone?: 'crimson' | 'cyan' | 'pack' | 'amber'
  className?: string
}) => {
  const tones = {
    crimson: 'from-crimson-500 to-rose-400',
    cyan: 'from-cyber-400 to-sky-400',
    pack: 'from-pack-500 to-emerald-400',
    amber: 'from-amber-400 to-orange-400',
  }
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]', className)}>
      <div
        className={cx('h-full rounded-full bg-gradient-to-r transition-all duration-500', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>
  value: T
  onChange: (value: T) => void
  className?: string
}) => {
  const layoutId = useId()
  return (
  <div
    className={cx(
      'flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1',
      className,
    )}
  >
    {options.map((option) => {
      const active = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            'relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs',
            active ? 'text-white' : 'text-white/45 hover:text-white/75',
          )}
        >
          {active ? (
            <motion.span
              layoutId={`segmented-${layoutId}`}
              className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.09]"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          ) : null}
          <span className="relative z-10 flex items-center gap-1.5">
            {option.icon}
            {option.label}
          </span>
        </button>
      )
    })}
  </div>
  )
}

export const Stat = ({
  label,
  value,
  hint,
  accent = 'text-white',
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: string
}) => (
  <div className="min-w-0">
    <p className={cx('font-display text-lg font-semibold leading-none tracking-tight sm:text-xl', accent)}>
      {value}
    </p>
    <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    {hint ? <p className="mt-0.5 text-[10px] text-white/30">{hint}</p> : null}
  </div>
)

export const Divider = ({ className }: { className?: string }) => (
  <div className={cx('h-px w-full bg-white/[0.07]', className)} />
)

/* ------------------------------------------------------------------ */
/* Modal / bottom sheet                                                */
/* ------------------------------------------------------------------ */

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'auto' | 'center'
  hideClose?: boolean
}

const modalWidths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  variant = 'auto',
  hideClose,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cx(
            'fixed inset-0 z-[80] flex justify-center',
            variant === 'center' ? 'items-center p-4' : 'items-end sm:items-center sm:p-6',
          )}
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Dialog'}
            className={cx(
              'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-ink-900/95 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:rounded-[28px]',
              modalWidths[size],
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent" />
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            {title ? (
              <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                    {title}
                  </h3>
                  {subtitle ? (
                    <p className="mt-1 text-xs leading-relaxed text-white/45">{subtitle}</p>
                  ) : null}
                </div>
                {!hideClose ? (
                  <IconButton label="Close" onClick={onClose} className="h-9 w-9 shrink-0">
                    <X className="h-4 w-4" />
                  </IconButton>
                ) : null}
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
            {footer ? (
              <div className="border-t border-white/[0.07] bg-ink-900/80 px-5 py-4 sm:px-6">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/50">
      {icon}
    </div>
    <h4 className="font-display text-base font-semibold text-white">{title}</h4>
    <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-white/45">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
)

export const ListRow = ({
  onClick,
  children,
  className,
}: {
  onClick?: () => void
  children: ReactNode
  className?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-white/10 hover:bg-white/[0.04]',
      className,
    )}
  >
    {children}
  </button>
)

export const CheckRow = ({ done, children }: { done?: boolean; children: ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <span
      className={cx(
        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
        done
          ? 'border-pack-500/40 bg-pack-500/20 text-pack-400'
          : 'border-white/15 bg-white/[0.04] text-transparent',
      )}
    >
      <Check className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
    <span className="text-xs leading-relaxed text-white/60">{children}</span>
  </div>
)

export const ArrowLink = ({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'inline-flex items-center gap-0.5 text-[11px] font-semibold text-crimson-400 transition hover:text-crimson-300',
      className,
    )}
  >
    {children}
    <ChevronRight className="h-3.5 w-3.5" />
  </button>
)

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

export const Logo = ({ compact = false }: { compact?: boolean }) => {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[13px] border border-amber-300/25 bg-ink-900 shadow-[0_0_15px_rgba(251,191,36,0.12)]">
        <svg viewBox="0 0 64 64" className="h-6 w-6">
          <defs>
            <linearGradient id={`logo-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          {/* Aerodynamic athletic 'M' telemetry mark */}
          <path
            d="M13 49V17l19 22 19-22v32"
            fill="none"
            stroke={`url(#logo-${gradientId})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Telemetry pulse wave bridge */}
          <path
            d="M20 37l12-14 12 14"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Pack sync radar ping */}
          <circle cx="32" cy="23" r="2.5" fill="#FBBF24" />
        </svg>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/15 via-crimson-500/10 to-cyber-400/10" />
      </div>
      {!compact ? (
        <div className="leading-none">
          <p className="font-display text-[17px] font-black tracking-[0.08em] text-white">
            MOTO<span className="text-amber-300">SYNC</span>
          </p>
          <p className="mt-0.5 text-[7.5px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Pack Connected · Ride in Sync
          </p>
        </div>
      ) : null}
    </div>
  )
}

/* Re-export a stable unique id helper for gradient ids. */
export const useSafeId = (prefix = 'id') => useId().replace(/[^a-zA-Z0-9]/g, `${prefix}`)

export const useAccentGradient = (accent: string) =>
  useMemo(
    () => ({
      background: `linear-gradient(135deg, ${accent}30, transparent 70%)`,
      borderColor: `${accent}40`,
    }),
    [accent],
  )

export const ModalContext = createContext<{ close: () => void } | null>(null)
export const useModalContext = () => useContext(ModalContext)
