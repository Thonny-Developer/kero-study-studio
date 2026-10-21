import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

/** 6 ячеек под код из письма. Под капотом один input — работает автоподстановка кода из SMS/почты и вставка. */
export function CodeInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
          onChange(v)
          if (v.length === 6) onComplete?.(v)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Код из письма"
        autoFocus
        className="absolute inset-0 h-full w-full opacity-0"
      />
      <div className="flex justify-center gap-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => {
          const d = value[i]
          const active = focused && i === Math.min(value.length, 5)
          return (
            <motion.div
              key={i}
              animate={{ scale: d ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.18 }}
              className={`grid h-[60px] w-[46px] place-items-center rounded-tile border-2 font-mono text-[26px] font-bold transition-colors ${
                d ? 'border-acc bg-acc-soft text-acc-ink shadow-[0_4px_0_var(--accSh)]' : active ? 'border-acc bg-sf shadow-btn-2' : 'border-line bg-sf shadow-btn-2'
              }`}
            >
              {d ?? (active ? <span className="animate-caret text-acc">▍</span> : '')}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/** Секунды до возможности запросить новый код */
export function useResendLeft(sentAt: number, now: number) {
  return Math.min(60, Math.max(0, Math.ceil((sentAt + 60_000 - now) / 1000)))
}

export const formatLeft = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
