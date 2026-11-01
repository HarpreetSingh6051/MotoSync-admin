import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cx } from '@/lib/format'

const toneStyles = {
  default: { border: 'border-white/12', icon: 'text-white/60', Icon: Info },
  success: { border: 'border-pack-500/35', icon: 'text-pack-400', Icon: CheckCircle2 },
  warn: { border: 'border-amber-400/35', icon: 'text-amber-300', Icon: AlertTriangle },
  danger: { border: 'border-rose-500/40', icon: 'text-rose-400', Icon: AlertTriangle },
}

export const ToastHost = () => {
  const toasts = useAppStore((state) => state.toasts)
  const dismiss = useAppStore((state) => state.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[70px] z-[120] flex flex-col items-center gap-2 px-3 sm:top-[78px]">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = toneStyles[toast.tone]
          const Icon = tone.Icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={cx(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-ink-850/95 px-3.5 py-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl',
                tone.border,
              )}
              role="status"
            >
              <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', tone.icon)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-snug text-white">{toast.message}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-full p-1 text-white/30 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
