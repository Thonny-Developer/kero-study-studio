import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Mascot, type MascotAnim, type Mood } from '../components/Mascot'
import { useBlinkLook } from '../lib/blink'
import { ItemArt } from '../components/pet/ItemArt'
import { DecorThumb, PetAccessories, Room } from '../components/pet/Room'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Coin } from '../components/ui/Coin'
import { Icon, type IconName } from '../lib/icons'
import type { PetConsumableId, PetDecorId } from '../lib/types'
import { useGame } from '../store/game'
import { toast } from '../store/toast'

type TopTab = 'home' | 'shop' | 'decor'
type ShopFilter = 'food' | 'drink'

interface ConsumableMeta {
  id: PetConsumableId
  kind: 'food' | 'drink'
  title: string
  stat: string
  xp: number
  tint: string
  phrase: string
}

interface DecorMeta {
  id: PetDecorId
  title: string
  sub: string
}

const CONSUMABLES: ConsumableMeta[] = [
  // Еда
  { id: 'food_cookie', kind: 'food', title: 'Печенька', stat: '+22 сытость', xp: 10, tint: '#FFE9CC', phrase: 'Хрум! Вкусно' },
  { id: 'food_ramen', kind: 'food', title: 'Рамен', stat: '+45 сытость', xp: 25, tint: '#FFE0DE', phrase: 'Горячий рамен!' },
  { id: 'food_pizza', kind: 'food', title: 'Пицца', stat: '+70 сытость', xp: 40, tint: '#FFF1C7', phrase: 'Пицца — топ!' },
  { id: 'food_burger', kind: 'food', title: 'Бургер', stat: '+85 сытость', xp: 55, tint: '#E3F6DF', phrase: 'Мощный бургер!' },
  { id: 'food_sushi', kind: 'food', title: 'Сет роллов', stat: '+100 сытость', xp: 80, tint: '#FFE4DA', phrase: 'Ойси!' },
  { id: 'food_cake', kind: 'food', title: 'Торт релиза', stat: '+100 сытость', xp: 120, tint: '#FFE1EC', phrase: 'Праздник!' },

  // Напитки
  { id: 'drink_water', kind: 'drink', title: 'Вода', stat: '+35 жажда', xp: 8, tint: '#DDF1FF', phrase: 'Освежает!' },
  { id: 'drink_coffee', kind: 'drink', title: 'Эспрессо', stat: '+50 жажда', xp: 20, tint: '#EFE6DD', phrase: 'Бодрит!' },
  { id: 'drink_matcha', kind: 'drink', title: 'Матча латте', stat: '+70 жажда', xp: 32, tint: '#E3F4D6', phrase: 'Дзен…' },
  { id: 'drink_boba', kind: 'drink', title: 'Бабл-ти', stat: '+88 жажда', xp: 48, tint: '#F6E8DA', phrase: 'Вкусняшка!' },
  { id: 'drink_smoothie', kind: 'drink', title: 'Манго-смузи', stat: '+100 жажда', xp: 65, tint: '#FFEBCF', phrase: 'Тропический буст!' },
  { id: 'drink_energy', kind: 'drink', title: 'Энергетик', stat: '+100 жажда', xp: 95, tint: '#DDFBEA', phrase: 'Турбо-режим!' },
]

const DECORS: DecorMeta[] = [
  { id: 'decor_rug', title: 'Коврик', sub: 'Пол' },
  { id: 'decor_plant', title: 'Фикус', sub: 'Левый угол' },
  { id: 'decor_lamp', title: 'Лава-лампа', sub: 'Правый угол' },
  { id: 'decor_poster', title: 'Постер', sub: 'Стена' },
  { id: 'decor_beanbag', title: 'Кресло-мешок', sub: 'Пол' },
  { id: 'decor_garland', title: 'Гирлянда', sub: 'Потолок' },
  { id: 'decor_shelf', title: 'Книжный шкаф', sub: 'Левый угол' },
  { id: 'decor_window', title: 'Окно в Токио', sub: 'Стена' },
  { id: 'decor_glasses', title: 'Кибер-очки', sub: 'На Блинка' },
  { id: 'decor_arcade', title: 'Аркада', sub: 'Правый угол' },
  { id: 'decor_cat', title: 'Робо-котик', sub: 'Друг' },
  { id: 'decor_crown', title: 'Корона', sub: 'На Блинка' },
  { id: 'decor_desk', title: 'Стол с ПК', sub: 'У стены' },
]

const PAT_PHRASES = ['Мрр-бип!', 'Так приятно!', 'Готов кодить!', 'Ты лучший!', 'Ещё-ещё!']

type Fx =
  | { id: number; kind: 'item'; item: PetConsumableId; x: number }
  | { id: number; kind: 'heart'; x: number }
  | { id: number; kind: 'spark'; dx: number; dy: number; color: string }

const SPARK_COLORS = ['#FFD166', '#FF6FA8', '#8CFFC1', '#4FD6FF']

const press = { whileTap: { scale: 0.95, y: 2 }, transition: { type: 'spring' as const, stiffness: 500, damping: 25 } }

function Segmented<T extends string>({
  value,
  onChange,
  items,
  layoutId,
}: {
  value: T
  onChange: (v: T) => void
  items: readonly (readonly [T, string, IconName])[]
  layoutId: string
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-sf2 p-1">
      {items.map(([id, label, icon]) => {
        const on = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`relative flex h-9 flex-1 items-center justify-center gap-1.5 text-xs font-extrabold transition-colors ${
              on ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {on && (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-[10px] bg-sf shadow-seg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span className={`relative ${on ? 'text-acc' : ''}`}>
              <Icon name={icon} size={15} />
            </span>
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function StatCard({ label, icon, value, color }: { label: string; icon: IconName; value: number; color: string }) {
  const low = value < 35
  return (
    <div className="flex flex-col gap-2 rounded-tile border-[1.5px] border-line bg-sf p-2.5 shadow-btn-2">
      <div className="flex items-center justify-between">
        <motion.span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
          animate={low ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={low ? { duration: 1, repeat: Infinity } : undefined}
        >
          <Icon name={icon} size={15} />
        </motion.span>
        <span className="font-mono text-[13px] font-extrabold text-ink">
          <AnimatedNumber value={value} />
          <span className="text-[10px] text-ink-3">%</span>
        </span>
      </div>
      <div className="text-[11px] font-bold text-ink-2">{label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-sf2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${Math.max(5, Math.min(100, value))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const cardV = { hidden: { opacity: 0, y: 14, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } } }

export function PetScreen() {
  const me = useGame((s) => s.me)
  const blink = useBlinkLook()
  const busy = useGame((s) => s.busy)
  const { feedPet, buyPetDecor, togglePetDecor, playWithPet, go } = useGame.getState()

  const [tab, setTab] = useState<TopTab>('home')
  const [shopFilter, setShopFilter] = useState<ShopFilter>('food')
  const [speech, setSpeech] = useState<string | null>(null)
  const [reactAnim, setReactAnim] = useState<MascotAnim | null>(null)
  const [reactMood, setReactMood] = useState<Mood | null>(null)
  const [fxList, setFxList] = useState<Fx[]>([])
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (!me) return null
  const pet = me.pet

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const spawn = (items: Fx[]) => {
    setFxList((prev) => [...prev.slice(-12), ...items])
    const ids = items.map((f) => f.id)
    later(() => setFxList((prev) => prev.filter((f) => !ids.includes(f.id))), 1300)
  }

  const burst = (main: Fx) => {
    const base = Date.now() + Math.random()
    const sparks: Fx[] = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.4
      const r = 52 + Math.random() * 18
      return { id: base + i + 1, kind: 'spark', dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.75 - 10, color: SPARK_COLORS[i % 4] }
    })
    spawn([main, ...sparks])
  }

  const react = (phrase: string, mood: Mood, anim: MascotAnim) => {
    setSpeech(phrase)
    setReactMood(mood)
    setReactAnim(anim)
    later(() => {
      setReactMood(null)
      setReactAnim(null)
    }, 1600)
    later(() => setSpeech((s) => (s === phrase ? null : s)), 2600)
  }

  const onPat = async () => {
    react(PAT_PHRASES[Math.floor(Math.random() * PAT_PHRASES.length)], 'happy', 'jump')
    burst({ id: Date.now() + Math.random(), kind: 'heart', x: Math.round((Math.random() - 0.5) * 50) })
    await playWithPet()
  }

  const onFeed = async (item: ConsumableMeta) => {
    const price = pet.prices[item.id] ?? 0
    if (me.coins < price) {
      toast('Не хватает монет — обменяй XP в Магазине')
      return
    }
    const ok = await feedPet(item.id)
    if (ok) {
      setTab('home')
      later(() => {
        react(item.phrase, 'wow', 'jump')
        burst({ id: Date.now() + Math.random(), kind: 'item', item: item.id, x: 0 })
      }, 250)
      toast(`${item.title}: ${item.stat}, +${item.xp} XP питомцу`)
    }
  }

  const onDecorAction = async (d: DecorMeta) => {
    if (pet.ownedDecor.includes(d.id)) {
      await togglePetDecor(d.id)
      return
    }
    const price = pet.prices[d.id] ?? 0
    if (me.coins < price) {
      toast('Не хватает монет — обменяй XP в Магазине')
      return
    }
    const ok = await buyPetDecor(d.id)
    if (ok) {
      react(`Ура! ${d.title}!`, 'happy', 'jump')
      toast(`${d.title} теперь в домике`)
    }
  }

  const savePetName = async () => {
    const clean = nameDraft.trim()
    if (!clean || clean === pet.name) {
      setEditingName(false)
      return
    }
    if (await playWithPet(clean)) {
      setEditingName(false)
      toast('Имя сохранено')
    }
  }

  const minStat = Math.min(pet.hunger, pet.thirst, pet.happiness)
  const baseMood: Mood = minStat < 30 ? 'sad' : minStat > 75 ? 'happy' : 'idle'
  const baseAnim: MascotAnim = minStat < 30 ? 'tilt' : 'bob'

  const statusHint =
    pet.hunger < 35 ? 'Проголодался…' : pet.thirst < 35 ? 'Хочет пить…' : pet.happiness < 40 ? 'Грустит, погладь' : 'Нажми на меня!'

  const levelPct = Math.min(100, Math.round((pet.levelXp / Math.max(1, pet.nextLevelXp)) * 100))

  const petLayer = (interactive: boolean) => (
    <div className="absolute bottom-[6%] left-[53%] -translate-x-1/2">
      <AnimatePresence>
        {fxList.map((fx) =>
          fx.kind === 'spark' ? (
            <motion.div
              key={fx.id}
              className="pointer-events-none absolute left-1/2 top-[45%] z-20"
              style={{ color: fx.color }}
              initial={{ x: -6, y: -6, scale: 0, opacity: 1 }}
              animate={{ x: fx.dx - 6, y: fx.dy - 6, scale: [0, 1.2, 0.4], opacity: [1, 1, 0], rotate: 90 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Icon name="spark" size={12} />
            </motion.div>
          ) : (
            <motion.div
              key={fx.id}
              className="pointer-events-none absolute left-1/2 top-0 z-20 -ml-4"
              initial={{ opacity: 0, y: 10, x: fx.x, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], y: -70, x: fx.x, scale: [0.4, 1.3, 1, 0.9], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {fx.kind === 'item' ? (
                <ItemArt id={fx.item} size={34} />
              ) : (
                <span className="block text-[#FF5C8A]">
                  <Icon name="heart" size={30} />
                </span>
              )}
            </motion.div>
          ),
        )}
      </AnimatePresence>

      {interactive && (
        <div className="absolute -top-9 left-1/2 z-10 -translate-x-1/2">
          <AnimatePresence mode="wait">
            <motion.div
              key={speech ?? statusHint}
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="relative whitespace-nowrap rounded-full border-[1.5px] border-line bg-sf px-3 py-1 text-[11px] font-extrabold text-ink shadow-tip"
            >
              {speech ?? statusHint}
              <span className="absolute -bottom-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b-[1.5px] border-r-[1.5px] border-line bg-sf" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <motion.button
        type="button"
        onClick={interactive ? onPat : undefined}
        whileTap={interactive ? { scale: 0.9 } : undefined}
        className="relative block select-none"
        aria-label="Погладить питомца"
        tabIndex={interactive ? 0 : -1}
      >
        <Mascot size={interactive ? 118 : 96} mood={reactMood ?? baseMood} anim={reactAnim ?? baseAnim} color={blink.color} skin={blink.skin}>
          <PetAccessories equipped={pet.equippedDecor} scale={interactive ? 1 : 96 / 118} skin={blink.skin} />
        </Mascot>
      </motion.button>
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex flex-col gap-3 border-b border-line bg-sf px-4 pb-3 desk:px-8" style={{ paddingTop: 'calc(var(--top) + 10px)' }}>
        <div className="mx-auto flex w-full flex-col gap-3 desk:max-w-[1040px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* кольцо прогресса уровня */}
              <div className="relative grid h-11 w-11 shrink-0 place-items-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
                  <circle cx={22} cy={22} r={19} fill="none" stroke="var(--sf2)" strokeWidth={4} />
                  <motion.circle
                    cx={22}
                    cy={22}
                    r={19}
                    fill="none"
                    stroke="var(--acc)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: Math.max(0.03, levelPct / 100) }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  />
                </svg>
                <span className="font-display text-[13px] font-bold text-ink">{pet.level}</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {editingName ? (
                  <motion.div key="edit" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePetName()
                        if (e.key === 'Escape') setEditingName(false)
                      }}
                      maxLength={18}
                      autoFocus
                      className="h-9 w-32 rounded-xl border-[1.5px] border-acc bg-sf2 px-2.5 text-sm font-extrabold text-ink outline-none"
                    />
                    <button type="button" onClick={savePetName} className="grid h-9 w-9 place-items-center rounded-xl bg-acc text-white" aria-label="Сохранить">
                      <Icon name="check" size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="name"
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setNameDraft(pet.name)
                      setEditingName(true)
                    }}
                    className="group flex min-w-0 flex-col items-start text-left"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{pet.name}</span>
                      <Icon name="edit" size={13} className="text-ink-3 opacity-60 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="font-mono text-[10.5px] font-bold text-ink-3">
                      {pet.levelXp} / {pet.nextLevelXp} XP до ур. {pet.level + 1}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              {...press}
              onClick={() => go('shop')}
              className="rail-hide flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-line bg-sf px-3 py-1.5 font-mono text-[13px] font-extrabold text-ink shadow-tip"
            >
              <Coin size={17} />
              <AnimatedNumber value={me.coins} />
            </motion.button>
          </div>

          <div className="desk:max-w-[420px]">
            <Segmented
              value={tab}
              onChange={setTab}
              layoutId="pet-tab"
              items={[
                ['home', 'Домик', 'home'],
                ['shop', 'Еда', 'bowl'],
                ['decor', 'Мебель', 'sofa'],
              ]}
            />
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[96px] pt-3.5 desk:px-8 desk:pb-10 desk:pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="mx-auto w-full desk:max-w-[1040px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {tab === 'home' && (
              <div className="flex flex-col gap-3 desk:gap-4">
                <div className="overflow-hidden rounded-card border-[1.5px] border-line bg-sf shadow-btn-2">
                  <Room equipped={pet.equippedDecor}>{petLayer(true)}</Room>
                </div>

                <div className="flex flex-col gap-3 desk:grid desk:grid-cols-2 desk:gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Сытость" icon="bowl" value={pet.hunger} color="#16A34A" />
                    <StatCard label="Жажда" icon="drop" value={pet.thirst} color="#0EA5E9" />
                    <StatCard label="Радость" icon="smile" value={pet.happiness} color="#F59E0B" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['Погладить', 'heart', onPat, '#FF5C8A'],
                        ['Покормить', 'bowl', () => setTab('shop'), '#16A34A'],
                        ['Обставить', 'sofa', () => setTab('decor'), 'var(--acc)'],
                      ] as const
                    ).map(([label, icon, fn, color]) => (
                      <motion.button
                        key={label}
                        type="button"
                        {...press}
                        onClick={fn}
                        className="flex flex-col items-center gap-1.5 rounded-tile border-[1.5px] border-line bg-sf py-3 text-[11.5px] font-extrabold text-ink shadow-btn-2"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
                          <Icon name={icon} size={18} />
                        </span>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'shop' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 desk:max-w-[520px]">
                  <StatCard label="Сытость" icon="bowl" value={pet.hunger} color="#16A34A" />
                  <StatCard label="Жажда" icon="drop" value={pet.thirst} color="#0EA5E9" />
                </div>

                <div className="desk:max-w-[320px]">
                  <Segmented
                    value={shopFilter}
                    onChange={setShopFilter}
                    layoutId="pet-food"
                    items={[
                      ['food', 'Еда', 'bowl'],
                      ['drink', 'Напитки', 'drop'],
                    ]}
                  />
                </div>

                <motion.div key={shopFilter} variants={listV} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5 desk:grid-cols-4 desk:gap-3">
                  {CONSUMABLES.filter((c) => c.kind === shopFilter).map((item) => {
                    const price = pet.prices[item.id] ?? 0
                    const canAfford = me.coins >= price
                    return (
                      <motion.div key={item.id} variants={cardV} className="flex flex-col gap-2.5 rounded-card border-[1.5px] border-line bg-sf p-2.5 shadow-btn-2">
                        <div className="relative grid h-[86px] place-items-center overflow-hidden rounded-tile" style={{ background: `color-mix(in srgb, ${item.tint} var(--pet-tint), var(--sf2))` }}>
                          <motion.div whileHover={{ scale: 1.12, rotate: -6 }} animate={{ y: [0, -3, 0] }} transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}>
                            <ItemArt id={item.id} size={56} />
                          </motion.div>
                          <span className="absolute right-1.5 top-1.5 rounded-md bg-sf px-1.5 py-0.5 font-mono text-[9.5px] font-extrabold text-acc-ink">+{item.xp} XP</span>
                        </div>
                        <div className="px-0.5">
                          <div className="truncate text-[13px] font-extrabold text-ink">{item.title}</div>
                          <div className={`text-[11px] font-bold ${item.kind === 'food' ? 'text-ok-ink' : 'text-[#0EA5E9]'}`}>{item.stat}</div>
                        </div>
                        <motion.button
                          type="button"
                          {...press}
                          disabled={busy}
                          onClick={() => onFeed(item)}
                          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl font-mono text-[13px] font-extrabold ${
                            canAfford ? 'bg-acc text-white shadow-btn-acc' : 'border-[1.5px] border-line bg-sf2 text-ink-3'
                          }`}
                        >
                          <Coin size={15} />
                          {price}
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}

            {tab === 'decor' && (
              <div className="flex flex-col gap-3 desk:grid desk:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] desk:items-start desk:gap-5">
                <div className="overflow-hidden rounded-card border-[1.5px] border-line bg-sf shadow-btn-2 desk:sticky desk:top-0">
                  <Room equipped={pet.equippedDecor}>{petLayer(false)}</Room>
                </div>

                <motion.div variants={listV} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5">
                  {DECORS.map((d) => {
                    const owned = pet.ownedDecor.includes(d.id)
                    const equipped = pet.equippedDecor.includes(d.id)
                    const price = pet.prices[d.id] ?? 0
                    const canAfford = me.coins >= price
                    return (
                      <motion.div
                        key={d.id}
                        variants={cardV}
                        className={`flex flex-col gap-2.5 rounded-card border-[1.5px] bg-sf p-2.5 transition-colors ${
                          equipped ? 'border-acc shadow-[0_4px_0_var(--accSh)]' : 'border-line shadow-btn-2'
                        }`}
                      >
                        <div className={`relative grid h-[86px] place-items-center overflow-hidden rounded-tile ${equipped ? 'bg-acc-soft' : 'bg-sf2'}`}>
                          <motion.div className="h-[70px] w-[86%]" whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                            <DecorThumb id={d.id} />
                          </motion.div>
                          <AnimatePresence>
                            {equipped && (
                              <motion.span
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-acc text-white"
                              >
                                <Icon name="check" size={12} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {!owned && (
                            <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-sf text-ink-3">
                              <Icon name="lock" size={11} />
                            </span>
                          )}
                        </div>
                        <div className="px-0.5">
                          <div className="truncate text-[13px] font-extrabold text-ink">{d.title}</div>
                          <div className="text-[11px] font-bold text-ink-3">{d.sub}</div>
                        </div>
                        <motion.button
                          type="button"
                          {...press}
                          disabled={busy}
                          onClick={() => onDecorAction(d)}
                          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-extrabold ${
                            owned
                              ? equipped
                                ? 'border-[1.5px] border-line bg-sf2 text-ink-2'
                                : 'bg-ok text-white shadow-btn-ok'
                              : canAfford
                                ? 'bg-acc font-mono text-[13px] text-white shadow-btn-acc'
                                : 'border-[1.5px] border-line bg-sf2 font-mono text-[13px] text-ink-3'
                          }`}
                        >
                          {owned ? (
                            equipped ? (
                              'Убрать'
                            ) : (
                              'Поставить'
                            )
                          ) : (
                            <>
                              <Coin size={15} />
                              {price}
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
