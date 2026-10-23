import type { ReactNode } from 'react'
import { useGame } from '../../store/game'
import { Icon, type IconName } from '../../lib/icons'
import { AnimatedNumber } from './AnimatedNumber'
import { Coin } from './Coin'

function Chip({ icon, color, value }: { icon: IconName | ReactNode; color?: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-[5px] rounded-xl border-[1.5px] border-line bg-sf px-2.5 py-1.5 text-[15px] font-extrabold">
      <span style={{ color }}>{typeof icon === 'string' ? <Icon name={icon as IconName} size={16} /> : icon}</span>
      {value}
    </div>
  )
}

/** 999 → «999», 1 565 → «1.5к», 2 300 000 → «2.3м» (округление вниз, чтобы не завышать) */
const compact = (n: number) => {
  const v = Math.round(n)
  if (v < 1000) return String(v)
  const [d, suf] = v < 1_000_000 ? [1000, 'к'] : [1_000_000, 'м']
  return `${(Math.floor((v / d) * 10) / 10).toFixed(1)}${suf}`
}

/** Стрик · XP · сердечки; в магазине — монеты · XP для обмена · сердечки */
export function StatsHeader({ shop = false }: { shop?: boolean }) {
  const streak = useGame((s) => s.me?.streak ?? 0)
  const xp = useGame((s) => s.me?.xpBalance ?? 0)
  const coins = useGame((s) => s.me?.coins ?? 0)
  const hearts = useGame((s) => s.me?.hearts ?? 0)
  const infiniteHearts = useGame((s) => s.me?.infiniteHearts ?? false)
  if (shop)
    return (
      <div className="flex gap-1.5">
        <Chip icon={<Coin size={17} />} value={<AnimatedNumber value={coins} />} />
        <Chip icon="bolt" color="var(--acc)" value={<AnimatedNumber value={xp} />} />
        <Chip icon="heart" color="var(--err)" value={infiniteHearts ? '∞' : hearts} />
      </div>
    )
  return (
    <div className="flex gap-1.5">
      <Chip icon="flame" color="var(--gold)" value={streak} />
      <Chip icon="bolt" color="var(--acc)" value={<AnimatedNumber value={xp} format={compact} />} />
      <Chip icon="heart" color="var(--err)" value={infiniteHearts ? '∞' : hearts} />
    </div>
  )
}
