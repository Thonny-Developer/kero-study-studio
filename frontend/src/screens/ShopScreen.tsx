import { AnimatePresence, motion, MotionConfig, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { ExchangePanel } from '../components/shop/ExchangePanel'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Coin } from '../components/ui/Coin'
import { Logo } from '../components/ui/Logo'
import { StatsHeader } from '../components/ui/StatsHeader'
import { api } from '../lib/api'
import { plural } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import type { Shop, ShopItemId } from '../lib/types'
import { useGame } from '../store/game'

type Tab = 'items' | 'exchange'
type Category = 'Всё' | 'Усилители' | 'Оформление'

const CATEGORIES: Category[] = ['Всё', 'Усилители', 'Оформление']

interface Item {
  id: ShopItemId
  name: string
  description: string
  category: Exclude<Category, 'Всё'>
  icon: IconName
  color: string
  soft: string
  tag: string
}

const ITEMS: Item[] = [
  {
    id: 'heart',
    name: 'Запасное сердце',
    description: 'Сразу +1 сердечко, не дожидаясь восстановления.',
    category: 'Усилители',
    icon: 'heart',
    color: 'var(--err)',
    soft: 'var(--errSoft)',
    tag: 'Для уроков',
  },
  {
    id: 'double',
    name: 'Двойной XP',
    description: '30 минут весь опыт за уроки удваивается.',
    category: 'Усилители',
    icon: 'bolt',
    color: 'var(--goldInk)',
    soft: 'var(--goldSoft)',
    tag: 'На 30 минут',
  },
  {
    id: 'blink',
    name: 'Золотой Блинк',
    description: 'Золотой окрас для спутника на карте пути.',
    category: 'Оформление',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Для Блинка',
  },
  {
    id: 'frame',
    name: 'Золотая рамка',
    description: 'Яркая рамка вокруг аватара в профиле.',
    category: 'Оформление',
    icon: 'star',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Для профиля',
  },
]

// панели выезжают в сторону переключения вкладки
const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 24 }),
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Segment<T extends string>({ id, value, options, onChange }: { id: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-tile bg-sf2 p-1" role="tablist">
      {options.map(([v, label]) => {
        const on = value === v
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(v)}
            className={`relative flex-1 rounded-[10px] py-2 text-[13px] font-bold transition-colors ${on ? 'text-ink' : 'text-ink-2'}`}
          >
            {on && <motion.span layoutId={id} className="absolute inset-0 rounded-[10px] bg-sf shadow-seg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Кошелёк: баланс монет и переход в обменник */
function Wallet({ onExchange }: { onExchange: () => void }) {
  const coins = useGame((s) => s.me?.coins ?? 0)
  const xp = useGame((s) => s.me?.xpBalance ?? 0)
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-unit bg-acc py-4 pl-4 pr-[112px] text-white shadow-unit-acc"
    >
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-white/[.08]" />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 [perspective:400px]">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -6, 0], rotateY: [0, 0, 360] }}
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 12, delay: 0.1 },
            opacity: { duration: 0.2, delay: 0.1 },
            y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
            rotateY: { duration: 4.5, times: [0, 0.7, 1], repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
          }}
        >
          <Coin size={76} className="drop-shadow-[0_6px_10px_rgba(0,0,0,.18)]" />
        </motion.div>
        {[
          [-14, -8, 12, 0],
          [70, -14, 10, 0.8],
          [74, 62, 11, 1.4],
        ].map(([x, y, s, d]) => (
          <motion.span
            key={d}
            className="absolute"
            style={{ left: x, top: y }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, delay: 0.5 + d }}
          >
            <Icon name="spark" size={s} />
          </motion.span>
        ))}
      </div>

      <div className="font-mono text-[10.5px] font-bold tracking-[.12em] text-white/75">ТВОИ МОНЕТЫ</div>
      <div className="mt-1 font-display text-[34px] font-extrabold leading-none tracking-[-.04em]">
        <AnimatedNumber value={coins} />
      </div>
      <div className="mt-1.5 text-[12.5px] text-white/85">
        Для обмена: {xp.toLocaleString('ru-RU')} XP
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={onExchange}
        className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-white/[.2] px-2.5 py-1.5 text-[12px] font-bold"
      >
        <Icon name="refresh" size={13} />
        Обменять XP
      </motion.button>
    </motion.section>
  )
}

function ItemCard({ item, index, price, onBuy }: { item: Item; index: number; price: number | undefined; onBuy: (s: Shop) => void }) {
  const coins = useGame((s) => s.me?.coins ?? 0)
  const owned = useGame((s) => s.me?.owned.includes(item.id) ?? false)
  const doubleUntil = useGame((s) => (item.id === 'double' ? s.me?.doubleXpUntil : null) ?? null)
  const busy = useGame((s) => s.busy)
  const buy = useGame((s) => s.buy)
  const icon = useAnimationControls()
  const btn = useAnimationControls()
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!doubleUntil) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [doubleUntil])

  const active = !!doubleUntil && doubleUntil > now
  const affordable = price !== undefined && coins >= price

  const tap = async () => {
    if (owned || busy || price === undefined) return
    if (!affordable) {
      btn.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } })
      return
    }
    const nextShop = await buy(item.id)
    if (nextShop) {
      icon.start({ rotate: [0, -14, 12, -8, 5, 0], scale: [1, 1.25, 1], transition: { duration: 0.55 } })
      onBuy(nextShop)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: index * 0.05 }}
      className="flex items-center gap-3 rounded-card border-[1.5px] border-line bg-sf p-3 shadow-btn-2"
    >
      <motion.div animate={icon} className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[18px]" style={{ background: item.soft, color: item.color }}>
        <Icon name={item.icon} size={28} />
        {active && (
          <motion.span
            className="absolute inset-0 rounded-[18px] border-2 border-gold"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
      </motion.div>
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[9.5px] font-bold tracking-[.06em] text-ink-3">{item.tag.toUpperCase()}</span>
        <h3 className="mt-0.5 text-[14.5px] font-extrabold leading-tight text-ink">{item.name}</h3>
        <p className="mt-0.5 text-[12px] leading-[1.35] text-ink-2">{item.description}</p>
        {active && <div className="mt-1 font-mono text-[10.5px] font-bold text-gold-ink">АКТИВЕН · {mmss(doubleUntil - now)}</div>}
      </div>
      {owned ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ok-soft px-2.5 py-2 text-[12px] font-extrabold text-ok-ink">
          <Icon name="check" size={14} />
          Есть
        </span>
      ) : (
        <motion.button
          type="button"
          animate={btn}
          whileTap={affordable ? { y: 3, boxShadow: '0 0 0 transparent' } : undefined}
          onClick={tap}
          disabled={price === undefined}
          className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[14px] font-extrabold ${affordable ? 'bg-gold-soft text-gold-ink shadow-[0_3px_0_var(--goldSh)]' : 'bg-sf2 text-ink-3'}`}
        >
          <Coin size={17} className={affordable ? '' : 'opacity-60 grayscale'} />
          {price ?? '…'}
        </motion.button>
      )}
    </motion.div>
  )
}

function ItemsPanel({ shop, onExchange, onShop }: { shop: Shop | null; onExchange: () => void; onShop: (s: Shop) => void }) {
  const [category, setCategory] = useState<Category>('Всё')
  const visible = ITEMS.filter((item) => category === 'Всё' || item.category === category)
  return (
    <>
      <Wallet onExchange={onExchange} />

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-[-.02em]">Витрина</h2>
        <motion.span key={visible.length} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[11px] font-bold text-ink-3">
          {visible.length} {plural(visible.length, 'ПРЕДМЕТ', 'ПРЕДМЕТА', 'ПРЕДМЕТОВ')}
        </motion.span>
      </div>

      <div className="mt-3 flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`relative rounded-xl px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${category === c ? 'text-acc-ink' : 'text-ink-2'}`}
          >
            {category === c && <motion.span layoutId="shop-cat" className="absolute inset-0 rounded-xl bg-acc-soft" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {visible.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} price={shop?.items[item.id]} onBuy={onShop} />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

export function ShopScreen() {
  const [tab, setTab] = useState<Tab>('items')
  const [shop, setShop] = useState<Shop | null>(null)
  const dir = tab === 'exchange' ? 1 : -1

  const load = useCallback(() => {
    api<Shop>('/api/shop')
      .then(setShop)
      .catch(() => {})
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [load])

  return (
    <MotionConfig reducedMotion="user">
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
        <div className="flex items-center justify-between border-b border-line bg-bg px-5 pb-3.5 pt-2">
          <Logo size={21} />
          <StatsHeader shop />
        </div>

        <main className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-5 pb-[112px] pt-4">
          <Segment
            id="shop-tab"
            value={tab}
            onChange={setTab}
            options={[
              ['items', 'Товары'],
              ['exchange', 'Обменник'],
            ]}
          />
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={tab}
              className="mt-4"
              custom={dir}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {tab === 'items' ? <ItemsPanel shop={shop} onExchange={() => setTab('exchange')} onShop={setShop} /> : <ExchangePanel shop={shop} reload={load} onShop={setShop} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  )
}
