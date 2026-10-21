import { useGame } from '../../store/game'
import { Icon, type IconName } from '../../lib/icons'

function Chip({ icon, color, value }: { icon: IconName; color: string; value: string | number }) {
  return (
    <div className="flex items-center gap-[5px] rounded-xl border-[1.5px] border-line bg-sf px-2.5 py-1.5 text-[15px] font-extrabold">
      <span style={{ color }}>
        <Icon name={icon} size={16} />
      </span>
      {value}
    </div>
  )
}

/** Стрик · XP · сердечки */
export function StatsHeader() {
  const streak = useGame((s) => s.me?.streak ?? 0)
  const xp = useGame((s) => s.me?.xp ?? 0)
  const hearts = useGame((s) => s.me?.hearts ?? 0)
  return (
    <div className="flex gap-1.5">
      <Chip icon="flame" color="var(--gold)" value={streak} />
      <Chip icon="bolt" color="var(--acc)" value={xp.toLocaleString('ru-RU')} />
      <Chip icon="heart" color="var(--err)" value={hearts} />
    </div>
  )
}
