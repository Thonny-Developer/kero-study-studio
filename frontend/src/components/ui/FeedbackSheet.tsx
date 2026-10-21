import { AnimatePresence, motion } from 'framer-motion'
import type { Feedback, TaskType } from '../../lib/types'
import { Icon, type IconName } from '../../lib/icons'
import { SB_PASS, useGame } from '../../store/game'
import { Mascot } from '../Mascot'
import { Button, type ButtonVariant } from './Button'
import { Meter } from './ProgressBar'

interface Look {
  bg: string
  c: string
  ink: string
  icon: IconName
  btn: ButtonVariant
}

const OK: Look = { bg: 'var(--okSoft)', c: 'var(--ok)', ink: 'var(--okInk)', icon: 'check', btn: 'ok' }
const ERR: Look = { bg: 'var(--errSoft)', c: 'var(--err)', ink: 'var(--errInk)', icon: 'x', btn: 'err' }
const MEH: Look = { bg: 'var(--goldSoft)', c: 'var(--gold)', ink: 'var(--goldInk)', icon: 'spark', btn: 'gold' }

/** Bottom sheet с фидбеком от сервера после «Проверить» */
export function FeedbackSheet({ type, fb }: { type: TaskType; fb: Feedback | null }) {
  const hearts = useGame((s) => s.me?.hearts ?? 0)
  const busy = useGame((s) => s.busy)
  const next = useGame((s) => s.next)

  const sb = type === 'sb'
  const look = !fb ? OK : sb ? ((fb.score ?? 0) >= SB_PASS ? OK : MEH) : fb.correct ? OK : ERR
  const good = look === OK

  let meta: string
  let metaIcon: IconName
  if (fb && fb.xp > 0) {
    meta = `+${fb.xp} XP`
    metaIcon = 'bolt'
  } else if (sb) {
    meta = 'Сердечки не тратим — это песочница'
    metaIcon = 'heart'
  } else {
    meta = hearts > 0 ? `−1 сердечко · осталось ${hearts}` : 'Сердечки закончились'
    metaIcon = 'heart'
  }

  return (
    <AnimatePresence>
      {fb && (
        <>
          <motion.div
            key="dim"
            className="absolute inset-0 z-[4] bg-[rgba(10,8,20,.2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key="sheet"
            role="dialog"
            className="no-scrollbar absolute inset-x-0 bottom-0 z-[5] flex max-h-[85%] flex-col gap-3.5 overflow-y-auto rounded-t-sheet px-5 pt-[22px]"
            style={{ background: look.bg, paddingBottom: 'calc(var(--bottom) + 10px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                style={{ background: look.c }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.06, 1], opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <Icon name={look.icon} size={good ? 22 : 20} />
              </motion.div>
              <div className="flex-1 text-pretty font-display text-[17px] font-bold leading-[1.25] tracking-[-.02em]" style={{ color: look.ink }}>
                {fb.title}
              </div>
              <div className="-my-3.5">
                <Mascot size={58} mood={good ? 'happy' : 'sad'} anim={good ? 'jump' : 'tilt'} />
              </div>
            </div>

            {sb && fb.score != null && (
              <div className="flex flex-col gap-2 rounded-2xl bg-sf px-3.5 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-bold text-ink-2">Оценка AI</span>
                  <span className="font-display text-xl font-extrabold" style={{ color: look.ink }}>
                    {Math.round(fb.score / 10)}
                    <span className="text-[13px] text-ink-3">/10</span>
                  </span>
                </div>
                <Meter value={fb.score / 100} color={look.c} height={10} />
              </div>
            )}

            <div className="text-pretty text-[14.5px] leading-normal text-ink">{fb.text}</div>

            {fb.answer && (
              <div className="flex flex-col gap-1 rounded-tile bg-sf px-3 py-2.5">
                <span className="font-mono text-[10.5px] font-bold tracking-[.08em]" style={{ color: look.ink }}>
                  {sb ? 'УЛУЧШЕННЫЙ ПРОМПТ' : 'ПРАВИЛЬНЫЙ ОТВЕТ'}
                </span>
                <span className="whitespace-pre-wrap font-mono text-[12.5px] leading-normal">{fb.answer}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 font-mono text-[12.5px] font-bold" style={{ color: look.ink }}>
              <Icon name={metaIcon} size={14} />
              {meta}
            </div>

            <Button variant={look.btn} onClick={next} disabled={busy}>
              {good || sb ? 'Дальше' : 'Понятно'}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
