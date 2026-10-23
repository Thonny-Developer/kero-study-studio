import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../lib/icons'
import { useGame } from '../../store/game'
import { Mascot } from '../Mascot'
import { useBlinkLook } from '../../lib/blink'
import { AnimatedNumber } from './AnimatedNumber'
import { Coin } from './Coin'
import { Meter } from './ProgressBar'

const card = 'rounded-card border-[1.5px] border-line bg-sf p-4 shadow-btn-2'

function Stat({ icon, color, value, label }: { icon: IconName | 'coin'; color?: string; value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-tile bg-sf2 py-2.5" title={label}>
      <span style={{ color }}>{icon === 'coin' ? <Coin size={20} /> : <Icon name={icon} size={20} />}</span>
      <span className="font-mono text-[14px] font-extrabold text-ink">{value}</span>
    </div>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11.5px] font-bold text-ink-2">
      <span className="w-[62px]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-sf2">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={false} animate={{ width: `${Math.max(4, value)}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-ink">{value}%</span>
    </div>
  )
}

/** Правая колонка десктопа: статы, квест дня, питомец, кошелёк */
export function RightRail() {
  const me = useGame((s) => s.me)
  const blink = useBlinkLook()
  const go = useGame((s) => s.go)
  if (!me) return null
  const quest = Math.min(me.todayLessons, me.questGoal)
  const pet = me.pet
  const sad = Math.min(pet.hunger, pet.thirst, pet.happiness) < 30

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        <Stat icon="flame" color="var(--gold)" value={me.streak} label="Стрик" />
        <Stat icon="coin" value={<AnimatedNumber value={me.coins} />} label="Монеты" />
        <Stat icon="bolt" color="var(--acc)" value={<AnimatedNumber value={me.xpBalance} />} label="XP для обмена" />
        <Stat icon="heart" color="var(--err)" value={me.infiniteHearts ? '∞' : me.hearts} label="Сердца" />
      </div>

      <section className={card}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-tile bg-gold-soft text-gold-sh">
            <Icon name="target" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold">Квест дня</div>
            <div className="text-[12px] text-ink-2">Пройди {me.questGoal} урока</div>
          </div>
          <div className={`rounded-lg px-2 py-1 font-mono text-xs font-bold ${me.questDone ? 'bg-ok-soft text-ok-ink' : 'bg-gold-soft text-gold-ink'}`}>
            {me.questDone ? <Icon name="check" size={14} /> : `+${me.questXp} XP`}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <Meter value={quest / me.questGoal} />
          </div>
          <span className="font-mono text-xs text-ink-3">
            {quest}/{me.questGoal}
          </span>
        </div>
      </section>

      <motion.button type="button" whileTap={{ y: 3 }} onClick={() => go('pet')} className={`${card} text-left`}>
        <div className="flex items-center gap-3">
          <Mascot size={54} mood={sad ? 'sad' : 'happy'} anim={sad ? 'tilt' : 'bob'} color={blink.color} skin={blink.skin} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-extrabold">{pet.name}</div>
            <div className="font-mono text-[11px] font-bold text-ink-3">УР. {pet.level}</div>
          </div>
          <Icon name="back" size={16} className="rotate-180 text-ink-3" />
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <Bar label="Сытость" value={pet.hunger} color="#16A34A" />
          <Bar label="Жажда" value={pet.thirst} color="#0EA5E9" />
          <Bar label="Радость" value={pet.happiness} color="#F59E0B" />
        </div>
      </motion.button>

      <section className="relative overflow-hidden rounded-card bg-acc p-4 text-white shadow-unit-acc">
        <div className="pointer-events-none absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-white/[.08]" />
        <div className="font-mono text-[10.5px] font-bold tracking-[.12em] text-white/75">ТВОИ МОНЕТЫ</div>
        <div className="mt-1 flex items-center gap-2 font-display text-[28px] font-extrabold leading-none">
          <Coin size={26} />
          <AnimatedNumber value={me.coins} />
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => go('shop')}
          className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-white/[.2] px-3 py-1.5 text-[12.5px] font-bold"
        >
          <Icon name="gift" size={14} />
          В магазин
        </motion.button>
      </section>
    </div>
  )
}
