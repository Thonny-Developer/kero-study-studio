import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties } from 'react'
import { plural } from '../../lib/date'
import { Icon } from '../../lib/icons'
import type { Shop } from '../../lib/types'
import { useGame } from '../../store/game'
import { toast } from '../../store/toast'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { Button } from '../ui/Button'
import { Coin } from '../ui/Coin'
import { fmtPrice, PriceChart } from './PriceChart'

type Range = 'day' | 'week'

function useNow(every = 1000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every])
  return now
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Монетки, разлетающиеся после обмена */
function Burst({ n }: { n: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center">
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * 26 + (i % 2 ? 8 : -8)
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
            animate={{ x: [0, x * 0.6, x], y: [0, -90 - (i % 3) * 25, -40], scale: [0.4, 1.15, 0.9], opacity: [0, 1, 0], rotate: [0, x > 0 ? 200 : -200] }}
            transition={{ duration: 0.9, delay: i * 0.04, ease: 'easeOut' }}
          >
            <Coin size={26} />
          </motion.div>
        )
      })}
    </div>
  )
}

export function ExchangePanel({ shop, reload }: { shop: Shop | null; reload: () => void }) {
  const xp = useGame((s) => s.me?.xpBalance ?? 0)
  const busy = useGame((s) => s.busy)
  const exchange = useGame((s) => s.exchange)
  const [range, setRange] = useState<Range>('day')
  const [amount, setAmount] = useState(1)
  const [burst, setBurst] = useState(0)
  const now = useNow()

  const price = shop?.price ?? 0
  const max = price ? Math.floor(xp / price) : 0
  const coins = Math.min(Math.max(amount, max ? 1 : 0), max)
  const cost = Math.ceil(coins * price)
  const up = (shop?.change ?? 0) >= 0

  // курс меняется по расписанию — подтягиваем новый, как только он наступил
  useEffect(() => {
    if (shop && now >= shop.nextAt) reload()
  }, [now, shop, reload])

  const submit = async () => {
    if (!shop || !coins) return
    const r = await exchange(coins, shop.price)
    if (r === true) {
      setBurst((b) => b + 1)
      toast(`+${coins} ${plural(coins, 'монета', 'монеты', 'монет')} за ${cost} XP`)
      setAmount(1)
    } else if (r === 'price-changed') reload()
  }

  const quick: [string, number][] = [
    ['10', 10],
    ['25%', Math.floor(max / 4)],
    ['50%', Math.floor(max / 2)],
    ['Макс', max],
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* курс и график */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="rounded-card border-[1.5px] border-line bg-sf p-4 shadow-btn-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[10.5px] font-bold tracking-[.1em] text-ink-3">КУРС МОНЕТЫ</div>
            <div className="mt-1.5 flex items-center gap-2">
              <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }} className="grid">
                <Coin size={30} />
              </motion.span>
              <span className="font-display text-[26px] font-extrabold leading-none tracking-[-.03em] text-ink">
                {shop ? <AnimatedNumber value={price} format={fmtPrice} /> : '—'}
              </span>
              <span className="mt-1.5 text-[13px] font-extrabold text-ink-2">XP</span>
            </div>
          </div>
          {shop && (
            <motion.span
              key={shop.change}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-[12.5px] font-extrabold ${up ? 'bg-ok-soft text-ok-ink' : 'bg-err-soft text-err-ink'}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className={up ? '' : 'rotate-180'}>
                <path d="M5 1.5 9 8H1z" fill="currentColor" />
              </svg>
              {up ? '+' : ''}
              {shop.change.toLocaleString('ru-RU')}%
            </motion.span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between text-[11.5px] font-semibold text-ink-3">
          <span>{up ? 'Монета дорожает' : 'Монета дешевеет'} · за сутки</span>
          {shop && (
            <span className="inline-flex items-center gap-1 font-mono font-bold">
              <Icon name="clock" size={12} />
              {mmss(shop.nextAt - now)}
            </span>
          )}
        </div>

        <div className="mt-3">
          {shop ? <PriceChart points={range === 'day' ? shop.day : shop.week} week={range === 'week'} /> : <div className="h-[150px] animate-pulse rounded-tile bg-sf2" />}
        </div>

        <div className="mt-3 flex gap-1 rounded-tile bg-sf2 p-1">
          {(['day', 'week'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`relative flex-1 rounded-[10px] py-1.5 font-mono text-[11.5px] font-bold transition-colors ${range === r ? 'text-ink' : 'text-ink-3'}`}
            >
              {range === r && <motion.span layoutId="rate-range" className="absolute inset-0 rounded-[10px] bg-sf shadow-seg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{r === 'day' ? '24 ЧАСА' : '7 ДНЕЙ'}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* обмен */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.06 }}
        className="relative rounded-card border-[1.5px] border-line bg-sf p-4 shadow-btn-2"
      >
        <div className="flex items-stretch gap-2">
          <div className="flex-1 rounded-tile bg-sf2 px-3 py-2.5">
            <div className="text-[11px] font-bold text-ink-3">Отдаёшь</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
              <span className="text-acc">
                <Icon name="bolt" size={18} />
              </span>
              <AnimatedNumber value={cost} />
            </div>
          </div>
          <motion.div
            className="grid w-8 shrink-0 place-items-center text-ink-3"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </motion.div>
          <div className="flex-1 rounded-tile bg-gold-soft px-3 py-2.5">
            <div className="text-[11px] font-bold text-gold-ink">Получаешь</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
              <Coin size={20} />
              <AnimatedNumber value={coins} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            disabled={coins <= 1}
            onClick={() => setAmount(coins - 1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-line bg-sf text-lg font-extrabold text-ink-2 disabled:opacity-40"
          >
            −
          </motion.button>
          <input
            type="range"
            min={max ? 1 : 0}
            max={Math.max(1, max)}
            value={coins}
            disabled={!max}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="coin-range flex-1 disabled:opacity-40"
            style={{ '--fill': `${max > 1 ? ((coins - 1) / (max - 1)) * 100 : max ? 100 : 0}%` } as CSSProperties}
            aria-label="Сколько монет"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            disabled={coins >= max}
            onClick={() => setAmount(coins + 1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-line bg-sf text-lg font-extrabold text-ink-2 disabled:opacity-40"
          >
            +
          </motion.button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {quick.map(([label, n]) => (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.92 }}
              disabled={n < 1 || n > max}
              onClick={() => setAmount(n)}
              className={`rounded-[10px] py-1.5 font-mono text-[11.5px] font-bold transition-colors disabled:opacity-40 ${coins === n && n > 0 ? 'bg-gold-soft text-gold-ink' : 'bg-sf2 text-ink-2'}`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <div className="relative mt-4">
          <AnimatePresence>{burst > 0 && <Burst key={burst} n={7} />}</AnimatePresence>
          <Button variant="gold" disabled={!shop || !coins || busy} onClick={submit}>
            {max ? 'Обменять' : 'Не хватает XP'}
          </Button>
        </div>
        <p className="mt-3 text-center text-[11.5px] leading-[1.4] text-ink-3">
          Доступно {xp.toLocaleString('ru-RU')} XP. Обмен не трогает очки в лиге — тратится только накопленный баланс.
        </p>
      </motion.section>
    </div>
  )
}
