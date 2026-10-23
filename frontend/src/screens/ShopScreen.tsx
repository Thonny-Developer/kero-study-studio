import { AnimatePresence, motion, MotionConfig, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { ExchangePanel } from '../components/shop/ExchangePanel'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Avatar, StyledName } from '../components/ui/Avatar'
import { Coin } from '../components/ui/Coin'
import { Logo } from '../components/ui/Logo'
import { StatsHeader } from '../components/ui/StatsHeader'
import { api } from '../lib/api'
import { plural } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import type { AvatarFrameId, NameColorId, Shop, ShopItemId } from '../lib/types'
import { useGame } from '../store/game'

type Tab = 'items' | 'exchange'
type Category = 'Каталог' | 'Усилители' | 'Аватарки' | 'Цвет имени'

const CATEGORIES: Category[] = ['Каталог', 'Усилители', 'Аватарки', 'Цвет имени']

// карточки каталога на первой вкладке витрины
const CATALOG: { id: Exclude<Category, 'Каталог'>; icon: IconName; color: string; soft: string; description: string }[] = [
  { id: 'Усилители', icon: 'bolt', color: 'var(--gold)', soft: 'var(--goldSoft)', description: 'Сердца и двойной XP' },
  { id: 'Аватарки', icon: 'user', color: 'var(--acc)', soft: 'var(--accSoft)', description: 'Рамки и окрас спутника' },
  { id: 'Цвет имени', icon: 'type', color: 'var(--mkt)', soft: 'var(--mktSoft)', description: 'Градиенты для ника' },
]

interface Item {
  id: ShopItemId
  name: string
  description: string
  category: Exclude<Category, 'Каталог'>
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
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Спутник',
  },
  // Аватарки и эффекты
  {
    id: 'frame',
    name: 'Золотая корона',
    description: 'Золотое кольцо с кристаллами вокруг аватара.',
    category: 'Аватарки',
    icon: 'star',
    color: 'var(--goldInk)',
    soft: 'var(--goldSoft)',
    tag: 'Рамка',
  },
  {
    id: 'frame_emerald',
    name: 'Изумрудный кристалл',
    description: 'Гранёная изумрудная оправа с самоцветами.',
    category: 'Аватарки',
    icon: 'star',
    color: 'var(--okInk)',
    soft: 'var(--okSoft)',
    tag: 'Рамка',
  },
  {
    id: 'frame_ice',
    name: 'Арктический шторм',
    description: 'Ледяное сияние и кружащиеся кристаллы льда.',
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_neon',
    name: 'Неоновый импульс',
    description: 'Вращающееся неоновое кольцо с кибер-орбитой.',
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_thunder',
    name: 'Грозовой разряд',
    description: 'Электрическая плазма и бегущие дуги молний.',
    category: 'Аватарки',
    icon: 'bolt',
    color: 'var(--goldInk)',
    soft: 'var(--goldSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_sakura',
    name: 'Вишнёвый вихрь',
    description: 'Нежное розовое свечение и парящие лепестки сакуры.',
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_fire',
    name: 'Солнечное пламя',
    description: 'Живая огненная корона с пульсирующими искрами.',
    category: 'Аватарки',
    icon: 'flame',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_glitch',
    name: 'Кибер-глитч',
    description: 'Хроматический RGB-сдвиг и сканирующий контур.',
    category: 'Аватарки',
    icon: 'code',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_cosmos',
    name: 'Квантовая галактика',
    description: 'Двойная туманность с парящими звёздами по орбите.',
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Анимированная',
  },
  {
    id: 'frame_dragon',
    name: 'Дыхание дракона',
    description: 'Изумрудно-золотая чешуя и огненные руны.',
    category: 'Аватарки',
    icon: 'flame',
    color: 'var(--okInk)',
    soft: 'var(--okSoft)',
    tag: 'Легендарная',
  },
  {
    id: 'frame_void',
    name: 'Чёрная дыра',
    description: 'Тёмное ядро сингулярности и аккреционный вихрь.',
    category: 'Аватарки',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Легендарная',
  },
  // Окрасы имени
  {
    id: 'color_gold',
    name: 'Чистое золото',
    description: 'Золотой металлический градиент для имени.',
    category: 'Цвет имени',
    icon: 'star',
    color: 'var(--goldInk)',
    soft: 'var(--goldSoft)',
    tag: 'Градиент имени',
  },
  {
    id: 'color_emerald',
    name: 'Ядовитый изумруд',
    description: 'Сочный изумрудно-лаймовый переход.',
    category: 'Цвет имени',
    icon: 'star',
    color: 'var(--okInk)',
    soft: 'var(--okSoft)',
    tag: 'Градиент имени',
  },
  {
    id: 'color_sunset',
    name: 'Малиновый закат',
    description: 'Яркий градиент от алого заката к пурпуру.',
    category: 'Цвет имени',
    icon: 'flame',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Градиент имени',
  },
  {
    id: 'color_ocean',
    name: 'Ледяной аквамарин',
    description: 'Кристальный лазурно-бирюзовый окрас.',
    category: 'Цвет имени',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Градиент имени',
  },
  {
    id: 'color_cyber',
    name: 'Киберпанк',
    description: 'Переливающийся неоновый поток с мягким свечением.',
    category: 'Цвет имени',
    icon: 'bolt',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Анимированный цвет',
  },
  {
    id: 'color_fire',
    name: 'Живое пламя',
    description: 'Бегущий огненно-золотой градиент.',
    category: 'Цвет имени',
    icon: 'flame',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Анимированный цвет',
  },
  {
    id: 'color_aurora',
    name: 'Северное сияние',
    description: 'Голографический перелив полярного неба.',
    category: 'Цвет имени',
    icon: 'spark',
    color: 'var(--okInk)',
    soft: 'var(--okSoft)',
    tag: 'Анимированный цвет',
  },
  {
    id: 'color_royal',
    name: 'Имперский рубин',
    description: 'Сияющий рубиново-золотой королевский окрас.',
    category: 'Цвет имени',
    icon: 'star',
    color: 'var(--err)',
    soft: 'var(--errSoft)',
    tag: 'Легендарный цвет',
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
  const userName = useGame((s) => s.me?.user.name ?? '?')
  const owned = useGame((s) => s.me?.owned.includes(item.id) ?? false)
  const avatarFrame = useGame((s) => s.me?.avatarFrame ?? null)
  const nameColor = useGame((s) => s.me?.nameColor ?? null)
  const doubleUntil = useGame((s) => (item.id === 'double' ? s.me?.doubleXpUntil : null) ?? null)
  const busy = useGame((s) => s.busy)
  const buy = useGame((s) => s.buy)
  const setAvatarFrame = useGame((s) => s.setAvatarFrame)
  const setNameColor = useGame((s) => s.setNameColor)
  const icon = useAnimationControls()
  const btn = useAnimationControls()
  const [now, setNow] = useState(Date.now)

  const isFrame = item.id.startsWith('frame')
  const isNameColor = item.id.startsWith('color_')
  const equippable = isFrame || isNameColor
  const equipped = isFrame ? avatarFrame === item.id : isNameColor ? nameColor === item.id : false

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
      <motion.div
        animate={icon}
        className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[18px]"
        style={isFrame ? undefined : isNameColor ? { background: 'var(--sf2)' } : { background: item.soft, color: item.color }}
      >
        {isFrame ? (
          <Avatar name={userName} frame={item.id as AvatarFrameId} size={42} />
        ) : isNameColor ? (
          <StyledName name="Aa" color={item.id as NameColorId} className="font-display text-[23px] font-extrabold tracking-tight" />
        ) : (
          <Icon name={item.icon} size={28} />
        )}
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
        <h3 className="mt-0.5 text-[14.5px] font-extrabold leading-tight text-ink">
          {isNameColor ? <StyledName name={item.name} color={item.id as NameColorId} /> : item.name}
        </h3>
        <p className="mt-0.5 text-[12px] leading-[1.35] text-ink-2">{item.description}</p>
        {active && <div className="mt-1 font-mono text-[10.5px] font-bold text-gold-ink">АКТИВЕН · {mmss(doubleUntil - now)}</div>}
      </div>
      {owned ? (
        equippable ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              isFrame
                ? setAvatarFrame(equipped ? null : (item.id as AvatarFrameId))
                : setNameColor(equipped ? null : (item.id as NameColorId))
            }
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[12px] font-extrabold transition-transform active:scale-95 ${
              equipped ? 'bg-ok-soft text-ok-ink' : 'bg-acc-soft text-acc-ink'
            }`}
          >
            {equipped && <Icon name="check" size={14} />}
            {equipped ? 'Надето' : 'Надеть'}
          </button>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ok-soft px-2.5 py-2 text-[12px] font-extrabold text-ok-ink">
            <Icon name="check" size={14} />
            Есть
          </span>
        )
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

/** Карточка категории в каталоге: иконка, мини-превью товаров, счётчик */
function CatalogCard({ cat, index, onOpen }: { cat: (typeof CATALOG)[number]; index: number; onOpen: () => void }) {
  const userName = useGame((s) => s.me?.user.name ?? '?')
  const ownedIds = useGame((s) => s.me?.owned ?? [])
  const items = ITEMS.filter((i) => i.category === cat.id)
  const owned = items.filter((i) => ownedIds.includes(i.id)).length
  return (
    <motion.button
      type="button"
      layout
      onClick={onOpen}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: index * 0.06 }}
      whileTap={{ y: 3, boxShadow: '0 0 0 transparent' }}
      className="group flex items-center gap-3 rounded-card border-[1.5px] border-line bg-sf p-3 text-left shadow-btn-2"
    >
      <motion.span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px]"
        style={{ background: cat.soft, color: cat.color }}
        whileHover={{ rotate: -8, scale: 1.06 }}
      >
        <Icon name={cat.icon} size={28} />
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold leading-tight text-ink">{cat.id}</span>
        <span className="mt-0.5 block text-[12px] text-ink-2">{cat.description}</span>
        <span className="mt-2 flex items-center gap-2">
          <span className="flex gap-1">
            {items.slice(0, 3).map((i) => (
              <span key={i.id} className="grid h-7 w-7 place-items-center rounded-full border-2 border-sf" style={{ background: i.id.startsWith('frame') ? 'transparent' : i.category === 'Цвет имени' ? 'var(--sf2)' : i.soft, color: i.color }}>
                {i.id.startsWith('frame') ? (
                  <Avatar name={userName} frame={i.id as AvatarFrameId} size={20} />
                ) : i.category === 'Цвет имени' ? (
                  <StyledName name="A" color={i.id as NameColorId} className="font-display text-[12px] font-extrabold" />
                ) : (
                  <Icon name={i.icon} size={14} />
                )}
              </span>
            ))}
          </span>
          <span className="font-mono text-[10.5px] font-bold text-ink-3">
            {items.length} {plural(items.length, 'ТОВАР', 'ТОВАРА', 'ТОВАРОВ')}
            {owned > 0 && <span className="text-ok-ink"> · {owned} ЕСТЬ</span>}
          </span>
        </span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sf2 text-ink-2 transition-transform group-hover:translate-x-0.5">
        <Icon name="back" size={16} className="rotate-180" />
      </span>
    </motion.button>
  )
}

function ItemsPanel({ shop, onExchange, onShop }: { shop: Shop | null; onExchange: () => void; onShop: (s: Shop) => void }) {
  const [category, setCategory] = useState<Category>('Каталог')
  const visible = ITEMS.filter((item) => item.category === category)
  return (
    <>
      <Wallet onExchange={onExchange} />

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-[-.02em]">Витрина</h2>
        <motion.span key={category} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[11px] font-bold text-ink-3">
          {category === 'Каталог'
            ? `${CATALOG.length} ${plural(CATALOG.length, 'КАТЕГОРИЯ', 'КАТЕГОРИИ', 'КАТЕГОРИЙ')}`
            : `${visible.length} ${plural(visible.length, 'ПРЕДМЕТ', 'ПРЕДМЕТА', 'ПРЕДМЕТОВ')}`}
        </motion.span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`relative shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors ${category === c ? 'text-acc-ink' : 'text-ink-2'}`}
          >
            {category === c && <motion.span layoutId="shop-cat" className="absolute inset-0 rounded-xl bg-acc-soft" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {category === 'Каталог'
            ? CATALOG.map((c, index) => <CatalogCard key={c.id} cat={c} index={index} onOpen={() => setCategory(c.id)} />)
            : visible.map((item, index) => <ItemCard key={item.id} item={item} index={index} price={shop?.items[item.id]} onBuy={onShop} />)}
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
