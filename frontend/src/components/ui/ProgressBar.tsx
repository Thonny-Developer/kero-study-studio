import { motion } from 'framer-motion'

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(4, Math.min(100, value * 100))
  return (
    <div className="h-3.5 flex-1 overflow-hidden rounded-lg bg-sf2">
      <motion.div
        className="flex h-full rounded-lg bg-acc px-1.5 py-[3px]"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <div className="h-[3px] flex-1 rounded-sm bg-white/35" />
      </motion.div>
    </div>
  )
}

export function Meter({ value, color = 'var(--gold)', height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="overflow-hidden rounded-[5px] bg-sf2" style={{ height }}>
      <motion.div
        className="h-full rounded-[5px]"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}
