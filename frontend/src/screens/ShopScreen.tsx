import { AnimatePresence, motion, MotionConfig, useAnimationControls } from 'framer-motion'
import { useState } from 'react'
import { Logo } from '../components/ui/Logo'
import { StatsHeader } from '../components/ui/StatsHeader'
import { plural } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import { toast } from '../store/toast'

type Category = 'Всё' | 'Усилители' | 'Оформление'

const CATEGORIES: Category[] = ['Всё', 'Усилители', 'Оформление']

interface Item {
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
    name: 'Запасное сердце',
    description: 'Ещё одна попытка, если ответ окажется неверным.',
    category: 'Усилители',
    icon: 'heart',
    color: 'var(--err)',
    soft: 'var(--errSoft)',
    tag: 'Для уроков',
  },
  {
    name: 'Двойной XP',
    description: 'Больше опыта за каждый пройденный урок.',
    category: 'Усилители',
    icon: 'bolt',
    color: 'var(--goldInk)',
    soft: 'var(--goldSoft)',
    tag: 'На время',
  },
  {
    name: 'Образ Блинка',
    description: 'Новый наряд для спутника на карте пути.',
    category: 'Оформление',
    icon: 'spark',
    color: 'var(--codeInk)',
    soft: 'var(--codeSoft)',
    tag: 'Для Блинка',
  },
  {
    name: 'Рамка профиля',
    description: 'Добавь яркий акцент к своей карточке профиля.',
    category: 'Оформление',
    icon: 'star',
    color: 'var(--mktInk)',
    soft: 'var(--mktSoft)',
    tag: 'Для профиля',
  },
]

// искры вокруг подарка в шапке: позиция, размер, задержка
const SPARKS: [number, number, number, number][] = [
  [8, 14, 13, 0],
  [80, 4, 10, 0.7],
  [92, 70, 12, 1.3],
]

function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-unit bg-acc py-4 pl-4 pr-[118px] text-white shadow-unit-acc"
    >
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-white/[.08]" />
      <div className="absolute right-4 top-1/2 h-[92px] w-[92px] -translate-y-1/2">
        <motion.div
          className="grid h-full w-full place-items-center rounded-[28px] bg-white/[.16]"
          initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 8, scale: 1, opacity: 1, y: [0, -6, 0] }}
          transition={{
            rotate: { type: 'spring', stiffness: 180, damping: 12, delay: 0.1 },
            scale: { type: 'spring', stiffness: 180, damping: 12, delay: 0.1 },
            opacity: { duration: 0.2, delay: 0.1 },
            y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
        >
          <Icon name="gift" size={52} />
        </motion.div>
        {SPARKS.map(([x, y, s, d]) => (
          <motion.span
            key={d}
            className="absolute text-white"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, delay: 0.5 + d }}
          >
            <Icon name="spark" size={s} />
          </motion.span>
        ))}
      </div>

      <div className="font-mono text-[10.5px] font-bold tracking-[.12em] text-white/75">VIBELY · SHOP</div>
      <h1 className="mt-1.5 font-display text-[20px] font-extrabold leading-[1.12] tracking-[-.03em]">Бонусы для прогресса</h1>
      <p className="mt-1.5 text-[12.5px] leading-[1.4] text-white/85">Усилители уроков и новые образы для Блинка.</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-white/[.18] px-2.5 py-1 text-[11.5px] font-bold">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} className="grid">
          <Icon name="spark" size={13} />
        </motion.span>
        Скоро в продаже
      </div>
    </motion.section>
  )
}

function Tabs({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  return (
    <div className="mt-3 flex gap-1 rounded-tile bg-sf2 p-1" role="tablist" aria-label="Категории магазина">
      {CATEGORIES.map((c) => {
        const on = value === c
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(c)}
            className={`relative flex-1 rounded-[10px] py-2 text-[13px] font-bold transition-colors ${on ? 'text-ink' : 'text-ink-2'}`}
          >
            {on && (
              <motion.span
                layoutId="shop-tab"
                className="absolute inset-0 rounded-[10px] bg-sf shadow-seg"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{c}</span>
          </button>
        )
      })}
    </div>
  )
}

function ItemCard({ item, index }: { item: Item; index: number }) {
  const icon = useAnimationControls()
  const tap = () => {
    icon.start({ rotate: [0, -14, 12, -8, 5, 0], scale: [1, 1.12, 1], transition: { duration: 0.5 } })
    toast(`«${item.name}» появится в магазине совсем скоро`)
  }

  return (
    <motion.button
      layout
      type="button"
      onClick={tap}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, delay: index * 0.05 }}
      whileTap={{ y: 4, boxShadow: '0 0 0 transparent' }}
      className="flex w-full items-center gap-3 rounded-card border-[1.5px] border-line bg-sf p-3 text-left shadow-btn-2"
    >
      <motion.div
        animate={icon}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px]"
        style={{ background: item.soft, color: item.color }}
      >
        <Icon name={item.icon} size={28} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[9.5px] font-bold tracking-[.06em] text-ink-3">{item.tag.toUpperCase()}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sf2 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink-3">
            <Icon name="lock" size={10} />
            СКОРО
          </span>
        </div>
        <h3 className="mt-0.5 text-[14.5px] font-extrabold leading-tight text-ink">{item.name}</h3>
        <p className="mt-0.5 text-[12px] leading-[1.35] text-ink-2">{item.description}</p>
      </div>
    </motion.button>
  )
}

export function ShopScreen() {
  const [category, setCategory] = useState<Category>('Всё')
  const visible = ITEMS.filter((item) => category === 'Всё' || item.category === category)

  return (
    <MotionConfig reducedMotion="user">
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
        <div className="flex items-center justify-between border-b border-line bg-bg px-5 pb-3.5 pt-2">
          <Logo size={21} />
          <StatsHeader />
        </div>

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-[112px] pt-4">
          <Hero />

          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold tracking-[-.02em]">Витрина</h2>
            <motion.span
              key={visible.length}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[11px] font-bold text-ink-3"
            >
              {visible.length} {plural(visible.length, 'ПРЕДМЕТ', 'ПРЕДМЕТА', 'ПРЕДМЕТОВ')}
            </motion.span>
          </div>

          <Tabs value={category} onChange={setCategory} />

          <div className="mt-3.5 flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {visible.map((item, index) => (
                <ItemCard key={item.name} item={item} index={index} />
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { delay: 0.3 }, layout: { type: 'spring', stiffness: 380, damping: 30 } }}
            className="mt-5 flex items-start gap-2.5 rounded-card bg-sf2 px-3.5 py-3 text-[12px] leading-[1.4] text-ink-2"
          >
            <motion.span
              className="mt-px text-gold-ink"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
            >
              <Icon name="bolt" size={17} />
            </motion.span>
            <p>Продолжай заниматься — новые товары и способы их получить скоро появятся здесь.</p>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  )
}
