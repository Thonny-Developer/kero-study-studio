import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { addDays, formatDuration, plural } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import { useGame } from '../store/game'

const CONFETTI = ['#7A5CFF', '#F25A35', '#16A34A', '#FFB21E', '#8CFFC1']

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{
            left: `${(i * 37) % 100}%`,
            width: i % 3 ? 8 : 10,
            height: i % 3 ? 14 : 10,
            borderRadius: i % 3 ? 3 : '50%',
            background: CONFETTI[i % 5],
          }}
          initial={{ y: -40, rotate: 0 }}
          animate={{ y: 900, rotate: 560 }}
          transition={{ duration: 2.4 + (i % 5) * 0.35, delay: (i % 7) * 0.18, ease: 'linear', repeat: Infinity }}
        />
      )),
    [],
  )
  return <div className="pointer-events-none absolute inset-0">{bits}</div>
}

export function EndScreen() {
  const result = useGame((s) => s.result)
  const me = useGame((s) => s.me)
  const continueAfterEnd = useGame((s) => s.continueAfterEnd)
  if (!result || !me) return null

  let sub = result.track === 'mkt' ? 'Ещё пара уроков — и у тебя готовый оффер.' : 'Ты на шаг ближе к своему лендингу.'
  if (result.isProject) sub = 'Юнит закрыт. Дальше AI соберёт проект по твоему промпту.'
  const bonuses = [
    result.flawlessBonus && `без ошибок +${result.flawlessBonus}`,
    result.questBonus && `квест дня +${result.questBonus}`,
    result.projectBonus && `проект +${result.projectBonus}`,
  ].filter(Boolean)

  const tiles: { label: string; value: string; icon: IconName; c: string; ink: string }[] = [
    { label: 'XP', value: `+${result.earned}`, icon: 'bolt', c: 'var(--gold)', ink: 'var(--goldInk)' },
    { label: 'ТОЧНОСТЬ', value: `${result.accuracy}%`, icon: 'target', c: 'var(--ok)', ink: 'var(--okInk)' },
    { label: 'ВРЕМЯ', value: formatDuration(result.timeMs), icon: 'clock', c: 'var(--acc)', ink: 'var(--accInk)' },
  ]
  const week = Array.from({ length: 7 }, (_, i) => me.days.includes(addDays(me.today, i - 6)))
  const streak = me.streak

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden px-5" style={{ paddingTop: 'calc(var(--top) + 10px)', paddingBottom: 'calc(var(--bottom) + 10px)' }}>
      <Confetti />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Mascot size={140} mood="happy" anim="jump" />
        <motion.div
          className="mt-2.5 font-display text-[30px] font-extrabold tracking-[-.03em]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.06, 1], opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Урок пройден!
        </motion.div>
        <div className="max-w-[300px] text-pretty text-[15.5px] leading-[1.45] text-ink-2">
          {sub}
          {bonuses.length > 0 && <span className="mt-1 block font-mono text-xs font-bold text-gold-ink">бонусы: {bonuses.join(' · ')}</span>}
        </div>
        <div className="mt-[18px] grid w-full grid-cols-3 gap-2.5">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              className="overflow-hidden rounded-btn border-2"
              style={{ borderColor: t.c, background: t.c }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.06, 1], opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.25 + i * 0.15 }}
            >
              <div className="py-[5px] text-[11.5px] font-extrabold tracking-[.05em] text-white">{t.label}</div>
              <div className="flex items-center justify-center gap-[5px] rounded-t-tile bg-sf py-3 font-display text-[19px] font-bold" style={{ color: t.ink }}>
                <Icon name={t.icon} size={16} />
                {t.value}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-1 flex w-full items-center gap-3.5 rounded-card bg-gold-soft px-4 py-3.5 text-left">
          <div className="text-gold">
            <Icon name="flame" size={22} />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold text-gold-ink">
              {streak} {plural(streak, 'день', 'дня', 'дней')} подряд
            </span>
            <span className="text-[13px] text-ink-2">Завтра не пропусти — огонёк ждёт</span>
          </div>
          <div className="flex gap-1">
            {week.map((on, i) => (
              <div key={i} className={`h-3.5 w-3.5 rounded-[5px] ${on ? 'bg-gold' : 'bg-sf2'}`} />
            ))}
          </div>
        </div>
      </div>
      <Button className="relative" onClick={continueAfterEnd}>
        Продолжить
      </Button>
    </div>
  )
}
