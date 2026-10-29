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
import { type ChartMode, fmtPrice, PriceChart } from './PriceChart'

type Side = 'buy' | 'sell'

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

function marketFactor(net: number) {
  const p = Math.max(-100, Math.min(100, net)) / 100
  return p >= 0 ? 0.7 * p : 0.45 * p
}

function coinImpact(coins: number, weight: number) {
  return weight * 22 * Math.log1p(Math.max(0, coins) / 12)
}

/** Расчёт цены сделки и нового курса с учётом объёма (совпадает с формулой сервера) */
function quoteTrade(spotPrice: number, netBefore: number, coins: number, side: Side) {
  if (!spotPrice || coins <= 0) {
    const unit = side === 'sell' ? Math.round(Math.max(3.4, spotPrice * 0.94) * 100) / 100 : spotPrice
    return { priceAfter: spotPrice, unitPrice: unit, totalXp: 0 }
  }
  const delta = coinImpact(coins, side === 'buy' ? 1.0 : -1.1)
  const netAfter = Math.max(-100, Math.min(100, netBefore + delta))
  const baseShift = (marketFactor(netAfter) - marketFactor(netBefore)) * 10
  const priceAfter = Math.round(Math.min(20, Math.max(4, spotPrice + baseShift)) * 100) / 100
  const avg = (spotPrice + priceAfter) / 2
  const unitPrice = side === 'sell' ? Math.round(Math.max(3.4, avg * 0.94) * 100) / 100 : Math.round(avg * 100) / 100
  const totalXp = side === 'sell' ? Math.max(1, Math.floor(coins * unitPrice)) : Math.max(1, Math.ceil(coins * unitPrice))
  return { priceAfter, unitPrice, totalXp }
}

/** Максимальное число монет, которое можно купить на баланс XP с учётом сдвига цены вверх */
function maxAffordableCoins(xp: number, spotPrice: number, netBefore: number) {
  if (!spotPrice || xp < Math.ceil(spotPrice)) return 0
  let lo = 1
  let hi = Math.min(10_000, Math.floor(xp / spotPrice) + 1)
  let best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (quoteTrade(spotPrice, netBefore, mid, 'buy').totalXp <= xp) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

/** Разлетающиеся монетки или молнии после сделки */
function Burst({ n, kind }: { n: number; kind: Side }) {
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
            {kind === 'buy' ? (
              <Coin size={26} />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-acc text-white shadow-md">
                <Icon name="bolt" size={16} />
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export function ExchangePanel({ shop, reload, onShop }: { shop: Shop | null; reload: () => void; onShop: (s: Shop) => void }) {
  const xp = useGame((s) => s.me?.xpBalance ?? 0)
  const myCoins = useGame((s) => s.me?.coins ?? 0)
  const busy = useGame((s) => s.busy)
  const exchange = useGame((s) => s.exchange)
  const sellCoins = useGame((s) => s.sellCoins)
  const [range, setRange] = useState<ChartMode>('live')
  const [side, setSide] = useState<Side>('buy')
  const [amount, setAmount] = useState(1)
  const [showStats, setShowStats] = useState(false)
  const [burst, setBurst] = useState<{ key: number; side: Side } | null>(null)
  const now = useNow()

  const price = shop?.price ?? 0
  const netImpulse = shop?.market.netImpulse ?? 0
  const max = side === 'buy' ? maxAffordableCoins(xp, price, netImpulse) : Math.min(10_000, myCoins)
  const coins = Math.min(Math.max(amount, max ? 1 : 0), max)
  const quote = quoteTrade(price, netImpulse, coins, side)
  const locked = !!shop?.locked?.[side]

  const chartPoints = shop ? (range === 'live' ? shop.live : range === 'day' ? shop.day : shop.week) : []
  const startPrice = chartPoints[0]?.[1] ?? price
  const periodChange = startPrice ? Math.round(((price - startPrice) / startPrice) * 1000) / 10 : 0
  const up = periodChange >= 0

  // Курс тикает каждые 15 секунд — автоматически подтягиваем свежий график и цену
  useEffect(() => {
    if (shop && now >= shop.nextAt) reload()
  }, [now, shop, reload])

  const switchSide = (next: Side) => {
    setSide(next)
    setAmount(1)
  }

  const submit = async () => {
    if (!shop || !coins) return
    if (side === 'buy') {
      const r = await exchange(coins, shop.price)
      if (r && r !== 'price-changed') {
        onShop(r.shop)
        setBurst({ key: Date.now(), side: 'buy' })
        toast(`+${coins} ${plural(coins, 'монета', 'монеты', 'монет')} за ${r.cost} XP · курс ↑`)
        setAmount(1)
      } else if (r === 'price-changed') reload()
    } else {
      const r = await sellCoins(coins, shop.price)
      if (r && r !== 'price-changed') {
        onShop(r.shop)
        setBurst({ key: Date.now(), side: 'sell' })
        toast(`+${r.xp} XP за ${coins} ${plural(coins, 'монету', 'монеты', 'монет')} · курс ↓`)
        setAmount(1)
      } else if (r === 'price-changed') reload()
    }
  }

  const m = shop?.market
  const pressure = m?.pressure ?? 0
  const marketStatus =
    pressure > 15
      ? { label: 'Высокий спрос', tone: 'text-err-ink bg-err-soft' }
      : pressure < -15
        ? { label: 'Курс снижается', tone: 'text-ok-ink bg-ok-soft' }
        : { label: 'Равновесие', tone: 'text-ink-2 bg-sf2' }

  const quick: [string, number][] = [
    ['5', 5],
    ['25%', Math.max(1, Math.floor(max / 4))],
    ['50%', Math.max(1, Math.floor(max / 2))],
    ['Макс', max],
  ]

  return (
    <div className="flex flex-col gap-3 desk:grid desk:grid-cols-[1.2fr_1fr] desk:items-start desk:gap-4">
      {/* курс и живой график */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="rounded-card border-[1.5px] border-line bg-sf p-4 shadow-btn-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }} className="grid">
              <Coin size={28} />
            </motion.span>
            <span className="font-display text-[26px] font-extrabold leading-none tracking-[-.03em] text-ink">
              {shop ? <AnimatedNumber value={price} format={fmtPrice} /> : '—'}
            </span>
            <span className="mt-1 text-[13px] font-extrabold text-ink-2">XP</span>
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-ok-soft px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-ok-ink">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />
              LIVE
            </span>
          </div>
          {shop && (
            <motion.span
              key={`${range}-${periodChange}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-[12.5px] font-extrabold ${up ? 'bg-ok-soft text-ok-ink' : 'bg-err-soft text-err-ink'}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className={up ? '' : 'rotate-180'}>
                <path d="M5 1.5 9 8H1z" fill="currentColor" />
              </svg>
              {up ? '+' : ''}
              {periodChange.toLocaleString('ru-RU')}%
            </motion.span>
          )}
        </div>

        <div className="mt-3">
          {shop ? <PriceChart points={chartPoints} mode={range} /> : <div className="h-[150px] animate-pulse rounded-tile bg-sf2" />}
        </div>

        <div className="mt-3 flex gap-1 rounded-tile bg-sf2 p-1">
          {(
            [
              ['live', 'LIVE'],
              ['day', '24 Ч'],
              ['week', '7 ДН'],
            ] as const
          ).map(([r, label]) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`relative flex-1 rounded-[10px] py-1.5 font-mono text-[11px] font-bold transition-colors ${range === r ? 'text-ink' : 'text-ink-3'}`}
            >
              {range === r && <motion.span layoutId="rate-range" className="absolute inset-0 rounded-[10px] bg-sf shadow-seg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {m && (
          <>
            <button
              type="button"
              onClick={() => setShowStats((v) => !v)}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[12px] font-bold text-ink-3 transition-colors hover:text-ink-2"
            >
              <span>Подробная статистика</span>
              <motion.svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ rotate: showStats ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path d="m6 9 6 6 6-6" />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {showStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 rounded-tile border border-line bg-bg/60 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-extrabold ${marketStatus.tone}`}>
                        {marketStatus.label}
                      </span>
                      <span className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold text-ink-3">
                        <span>импульс {pressure > 0 ? `+${pressure}` : pressure}%</span>
                        {shop && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="clock" size={11} />
                            {mmss(shop.nextAt - now)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-left">
                      <div className="rounded-lg bg-sf px-2.5 py-1.5">
                        <div className="flex items-center justify-between font-mono text-[9.5px] font-bold text-ink-3">
                          <span>КУПЛЕНО</span>
                          <span className="text-err-ink">↑</span>
                        </div>
                        <div className="mt-0.5 text-[12px] font-extrabold text-ink">+{m.bought24h.toLocaleString('ru-RU')} мон.</div>
                      </div>
                      <div className="rounded-lg bg-sf px-2.5 py-1.5">
                        <div className="flex items-center justify-between font-mono text-[9.5px] font-bold text-ink-3">
                          <span>СОЖЖЕНО</span>
                          <span className="text-ok-ink">↓↓</span>
                        </div>
                        <div className="mt-0.5 text-[12px] font-extrabold text-ink">−{m.burned24h.toLocaleString('ru-RU')} мон.</div>
                      </div>
                      <div className="rounded-lg bg-sf px-2.5 py-1.5">
                        <div className="flex items-center justify-between font-mono text-[9.5px] font-bold text-ink-3">
                          <span>ПРОДАНО</span>
                          <span className="text-ok-ink">↓</span>
                        </div>
                        <div className="mt-0.5 text-[12px] font-extrabold text-ink">−{m.sold24h.toLocaleString('ru-RU')} мон.</div>
                      </div>
                      <div className="rounded-lg bg-sf px-2.5 py-1.5">
                        <div className="flex items-center justify-between font-mono text-[9.5px] font-bold text-ink-3">
                          <span>УРОКИ</span>
                          <span className="text-ok-ink">↓</span>
                        </div>
                        <div className="mt-0.5 text-[12px] font-extrabold text-ink">+{m.xp24h.toLocaleString('ru-RU')} XP</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.section>

      {/* карточка обмена XP ⇄ Монеты */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.06 }}
        className="relative rounded-card border-[1.5px] border-line bg-sf p-4 shadow-btn-2"
      >
        <div className="mb-3 flex gap-1 rounded-tile bg-sf2 p-1">
          {(
            [
              ['buy', 'Купить монеты'],
              ['sell', 'Продать монеты'],
            ] as const
          ).map(([s, label]) => (
            <button
              key={s}
              type="button"
              onClick={() => switchSide(s)}
              className={`relative flex-1 rounded-[10px] py-1.5 text-[12px] font-extrabold transition-colors ${side === s ? 'text-ink' : 'text-ink-3'}`}
            >
              {side === s && <motion.span layoutId="exchange-side" className="absolute inset-0 rounded-[10px] bg-sf shadow-seg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-stretch gap-2">
          {side === 'buy' ? (
            <div className="flex-1 rounded-tile bg-sf2 px-3 py-2.5">
              <div className="text-[11px] font-bold text-ink-3">Отдаёшь</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
                <span className="text-acc">
                  <Icon name="bolt" size={18} />
                </span>
                <AnimatedNumber value={quote.totalXp} />
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-tile bg-gold-soft px-3 py-2.5">
              <div className="text-[11px] font-bold text-gold-ink">Отдаёшь</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
                <Coin size={20} />
                <AnimatedNumber value={coins} />
              </div>
            </div>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.88, rotate: 180 }}
            onClick={() => switchSide(side === 'buy' ? 'sell' : 'buy')}
            title="Поменять направление"
            className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-xl border border-line bg-bg text-ink-2 transition-colors hover:text-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
            </svg>
          </motion.button>

          {side === 'buy' ? (
            <div className="flex-1 rounded-tile bg-gold-soft px-3 py-2.5">
              <div className="text-[11px] font-bold text-gold-ink">Получаешь</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
                <Coin size={20} />
                <AnimatedNumber value={coins} />
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-tile bg-acc-soft px-3 py-2.5">
              <div className="text-[11px] font-bold text-acc-ink">Получаешь</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[22px] font-extrabold text-ink">
                <span className="text-acc">
                  <Icon name="bolt" size={18} />
                </span>
                <AnimatedNumber value={quote.totalXp} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2.5">
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
          <AnimatePresence>{burst && <Burst key={burst.key} n={7} kind={burst.side} />}</AnimatePresence>
          <Button variant={side === 'buy' ? 'gold' : 'acc'} disabled={!shop || !coins || busy || locked} onClick={submit}>
            {locked
              ? side === 'buy'
                ? 'Покупка монет закрыта'
                : 'Продажа монет закрыта'
              : side === 'buy'
              ? max
                ? `Купить (${fmtPrice(quote. priceAfter)} XP)`
                : 'Не хватает XP'
              : max
                ? `Продать (+${quote.totalXp} XP)`
                : 'Нет монет'}
          </Button>
        </div>
      </motion.section>
    </div>
  )
}
