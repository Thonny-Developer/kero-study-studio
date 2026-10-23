import { motion } from 'framer-motion'
import { Mascot } from '../components/Mascot'
import { Logo } from '../components/ui/Logo'
import { Meter } from '../components/ui/ProgressBar'
import { StatsHeader } from '../components/ui/StatsHeader'
import { Icon, type IconName } from '../lib/icons'
import type { NodeView, Track, UnitView } from '../lib/types'
import { nodeStatus, useGame } from '../store/game'

const NO_UNITS: UnitView[] = []
const NO_IDS: string[] = []

// Зигзаг узлов из макета
const XS = [0, -62, -92, -62, 0, 62, 92, 62]

function TrackSwitch() {
  const track = useGame((s) => s.track)
  const setTrack = useGame((s) => s.setTrack)
  const seg = (t: Track, icon: IconName, label: string) => {
    const a = track === t
    return (
      <button
        type="button"
        onClick={() => setTrack(t)}
        className={`flex h-[42px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all duration-150 ${a ? 'bg-sf text-acc-ink shadow-seg' : 'text-ink-2'}`}
      >
        <Icon name={icon} size={16} />
        {label}
      </button>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-sf2 p-1">
      {seg('code', 'code', 'Вайбкодинг')}
      {seg('mkt', 'mega', 'Маркетинг')}
    </div>
  )
}

function Quest() {
  const me = useGame((s) => s.me)
  if (!me) return null
  const count = Math.min(me.todayLessons, me.questGoal)
  const done = me.questDone
  return (
    <div className="flex items-center gap-3 rounded-card border-[1.5px] border-line bg-sf px-3.5 py-3">
      <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-tile bg-gold-soft text-gold-sh">
        <Icon name="target" size={22} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold">Квест дня: пройди {me.questGoal} урока</span>
          <span className="font-mono text-xs text-ink-3">
            {count}/{me.questGoal}
          </span>
        </div>
        <Meter value={count / me.questGoal} />
      </div>
      <div className={`rounded-lg px-[7px] py-1 font-mono text-xs font-bold ${done ? 'bg-ok-soft text-ok-ink' : 'bg-gold-soft text-gold-ink'}`}>
        {done ? <Icon name="check" size={14} /> : `+${me.questXp} XP`}
      </div>
    </div>
  )
}

function nodeLook(node: NodeView, status: 'done' | 'cur' | 'lock') {
  const isP = node.kind === 'project'
  const isG = node.kind === 'chest'
  if (status === 'lock')
    return { cls: 'bg-sf2 text-ink-3 shadow-node-lock', ring: 'var(--sf2)', icon: (isP ? 'trophy' : isG ? 'gift' : 'lock') as IconName, size: 28 }
  if (isP) return { cls: 'bg-gold text-white shadow-node-gold', ring: 'var(--gold)', icon: 'trophy' as IconName, size: 34 }
  if (status === 'done') return { cls: 'bg-acc text-white shadow-node-acc', ring: 'var(--acc)', icon: 'check' as IconName, size: 30 }
  return { cls: 'bg-acc text-white shadow-node-acc', ring: 'var(--acc)', icon: (isG ? 'gift' : 'star') as IconName, size: 34 }
}

function tip(node: NodeView) {
  if (node.kind === 'project') return 'Запусти проект'
  if (node.kind === 'chest') return 'Открой сундук'
  return `Старт · ${node.name}`
}

export function MapScreen() {
  const track = useGame((s) => s.track)
  const units = useGame((s) => s.course?.tracks[track] ?? NO_UNITS)
  // «Золотой Блинк» из магазина
  const blinkColor = useGame((s) => (s.me?.owned.includes('blink') ? 'var(--gold)' : undefined))
  const done = useGame((s) => s.me?.done ?? NO_IDS)
  const openNode = useGame((s) => s.openNode)

  const order = units.flatMap((u) => u.nodes.map((n) => n.id))
  const cur = order.find((id) => !done.includes(id)) ?? null
  const curIndex = cur ? order.indexOf(cur) : Infinity
  let unitStart = 0

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="relative z-[2] flex flex-col gap-3.5 border-b border-line bg-bg px-5 pb-3.5 pt-2">
        <div className="flex items-center justify-between">
          <Logo size={21} />
          <StatsHeader />
        </div>
        <TrackSwitch />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-[120px] pt-4">
        <Quest />
        {units.map((unit, ui) => {
          const start = unitStart
          unitStart += unit.nodes.length
          const active = curIndex >= start
          return (
            <motion.div
              key={`${track}-${unit.id}`}
              className="mt-[22px] flex flex-col"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ui * 0.06 }}
            >
              <div
                className={`flex items-center gap-3 rounded-unit py-4 pl-[18px] pr-4 ${active ? 'bg-acc text-white shadow-unit-acc' : 'bg-sf2 text-ink-2 shadow-unit-lock'}`}
              >
                <div className="flex flex-1 flex-col gap-[5px]">
                  <div className="font-mono text-[11.5px] font-bold tracking-[.08em] opacity-80">ЮНИТ {ui + 1}</div>
                  <div className="font-display text-lg font-bold tracking-[-.02em]">{unit.title}</div>
                  <div className="text-[13.5px] opacity-90">{unit.sub}</div>
                </div>
                <div className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-tile ${active ? 'bg-white/[.18]' : 'bg-sf'}`}>
                  <Icon name={active ? 'map' : 'lock'} size={22} />
                </div>
              </div>

              {unit.nodes.map((node, j) => {
                const status = nodeStatus(done, order, node.id)
                const isCur = status === 'cur'
                const x = XS[j % XS.length]
                const look = nodeLook(node, status)
                const size = isCur ? 80 : 70
                return (
                  <div key={node.id} className="relative flex justify-center pb-1.5" style={{ paddingTop: j === 0 ? (isCur ? 64 : 22) : isCur ? 60 : 16 }}>
                    <div className="relative" style={{ transform: `translateX(${x}px)` }}>
                      {isCur && (
                        <>
                          <div className="pointer-events-none absolute -inset-[9px] animate-node-pulse rounded-full border-4" style={{ borderColor: look.ring }} />
                          <div className="absolute bottom-full left-1/2 mb-4 animate-float whitespace-nowrap rounded-xl border-2 border-line bg-sf px-3 py-2 text-[13px] font-bold text-acc-ink shadow-tip">
                            {tip(node)}
                          </div>
                        </>
                      )}
                      <motion.button
                        type="button"
                        aria-label={node.name}
                        onClick={() => openNode(node.id)}
                        whileTap={{ y: 6, boxShadow: '0 0 0 transparent' }}
                        transition={{ duration: 0.08 }}
                        className={`relative grid place-items-center rounded-full ${look.cls}`}
                        style={{ width: size, height: size }}
                      >
                        <Icon name={look.icon} size={look.size} />
                      </motion.button>
                    </div>
                    {isCur && (
                      <div className="absolute bottom-0" style={x >= 0 ? { left: 22 } : { right: 22 }}>
                        <Mascot size={60} color={blinkColor} />
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )
        })}
        {units.length > 0 && !cur && (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <Mascot size={72} mood="happy" anim="jump" color={blinkColor} />
            <div className="font-display text-lg font-bold">Трек пройден!</div>
            <div className="text-sm text-ink-2">Попробуй второй трек — там свои проекты.</div>
          </div>
        )}
      </div>
    </div>
  )
}
