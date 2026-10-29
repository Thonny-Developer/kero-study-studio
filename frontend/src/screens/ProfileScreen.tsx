import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useState } from 'react'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Avatar, AVATAR_FRAMES, NAME_COLORS, StyledName } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Coin } from '../components/ui/Coin'
import { Stars } from '../components/ui/Stars'
import { api, ApiError } from '../lib/api'
import { MONTHS, MONTHS_GEN, plural, WEEKDAYS } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import type { Me, MyReview } from '../lib/types'
import { type GrantTarget, useGame } from '../store/game'
import { toast } from '../store/toast'

function Calendar({ me }: { me: Me }) {
  const [y, m, today] = me.today.split('-').map(Number)
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const total = new Date(y, m, 0).getDate()
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  const key = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className="flex flex-col gap-3 rounded-unit border-[1.5px] border-line bg-sf p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-bold">{MONTHS[m - 1]}</span>
        <span className="flex items-center gap-1 text-[13px] font-bold text-gold-ink">
          <span className="text-gold">
            <Icon name="flame" size={16} />
          </span>
          {me.streak} {plural(me.streak, 'день', 'дня', 'дней')} подряд
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[11px] font-bold text-ink-3">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={`e${i}`} />
          const active = me.days.includes(key(d))
          const future = d > today
          return (
            <div
              key={d}
              className={`grid aspect-square place-items-center rounded-[10px] border-2 text-[12.5px] font-bold ${active ? 'bg-gold text-white' : future ? 'text-ink-3' : 'bg-sf2 text-ink-3'}`}
              style={{ borderColor: d === today ? 'var(--goldSh)' : 'transparent' }}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmailCard({ me }: { me: Me }) {
  const busy = useGame((s) => s.busy)
  const sentAt = useGame((s) => s.codeSentAt)
  const { sendEmailCode, go } = useGame.getState()
  const [editing, setEditing] = useState(!me.user.email)
  const [value, setValue] = useState(me.user.email ?? '')
  const { email, emailVerified } = me.user
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

  // Код уже отправлен и ещё действует — просто открываем ввод
  const confirm = () => (Date.now() - sentAt < 15 * 60_000 ? go('verify') : sendEmailCode())

  return (
    <div className="flex flex-col gap-3 rounded-btn border-[1.5px] border-line bg-sf p-3.5">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-tile ${emailVerified ? 'bg-ok-soft text-ok-ink' : 'bg-gold-soft text-gold-ink'}`}>
          <Icon name="mail" size={22} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{email ?? 'Почта не привязана'}</span>
          <span className={`font-mono text-[11px] font-bold tracking-[.06em] ${emailVerified ? 'text-ok-ink' : 'text-gold-ink'}`}>
            {emailVerified ? 'ПОДТВЕРЖДЕНА' : email ? 'НЕ ПОДТВЕРЖДЕНА' : 'НУЖНА ДЛЯ ВОССТАНОВЛЕНИЯ'}
          </span>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-bold text-ink-2">
            Сменить
          </button>
        )}
      </div>
      {editing ? (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (valid && !busy && (await sendEmailCode(value.trim()))) setEditing(false)
          }}
        >
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="you@mail.com"
            autoComplete="email"
            className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line bg-bg px-3 text-[15px] font-semibold text-ink outline-none focus:border-acc"
          />
          <button type="submit" disabled={!valid || busy} className="h-11 shrink-0 rounded-xl bg-acc px-4 text-sm font-bold text-white shadow-[0_3px_0_var(--accSh)] disabled:bg-sf2 disabled:text-ink-3 disabled:shadow-none">
            Код
          </button>
        </form>
      ) : (
        !emailVerified && (
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="h-11 rounded-xl bg-acc text-sm font-bold text-white shadow-[0_3px_0_var(--accSh)] active:translate-y-[3px] active:shadow-none"
          >
            Подтвердить почту
          </button>
        )
      )}
    </div>
  )
}

const RATING_LABELS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично']

/** Отзыв о приложении: кнопка раскрывает форму со звёздами и текстом */
function ReviewCard() {
  const [mine, setMine] = useState<MyReview['review']>(null)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api<MyReview>('/api/review')
      .then((r) => setMine(r.review))
      .catch(() => {})
  }, [])

  const start = () => {
    setRating(mine?.rating ?? 0)
    setText(mine?.text ?? '')
    setOpen(true)
    api('/api/track', { body: { kind: 'review_open' } }).catch(() => {})
  }

  const send = async () => {
    if (!rating || sending) return
    setSending(true)
    try {
      const r = await api<MyReview>('/api/review', { body: { rating, text: text.trim() } })
      setMine(r.review)
      setOpen(false)
      toast('Спасибо за отзыв!')
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Не получилось отправить отзыв')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-btn border-[1.5px] border-line bg-sf p-3.5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-tile bg-gold-soft text-gold-ink">
          <Icon name="star" size={22} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{mine ? 'Твой отзыв' : 'Оцени Vibely'}</span>
          {mine ? <Stars value={mine.rating} size={14} /> : <span className="text-[12.5px] font-semibold text-ink-2">Расскажи, что нравится и что бесит</span>}
        </div>
        {!open && (
          <button type="button" onClick={start} className="shrink-0 text-sm font-bold text-ink-2">
            {mine ? 'Изменить' : 'Написать'}
          </button>
        )}
      </div>
      {mine?.text && !open && <p className="whitespace-pre-wrap break-words rounded-xl bg-bg px-3 py-2 text-[13px] font-medium text-ink-2">{mine.text}</p>}
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-2.5 overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <Stars value={rating} size={30} onChange={setRating} />
              <span className="text-[13px] font-bold text-ink-3">{RATING_LABELS[rating]}</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Что понравилось, чего не хватает?"
              className="min-h-[96px] resize-none rounded-xl border-2 border-line bg-bg px-3 py-2.5 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-3 focus:border-acc"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-11 shrink-0 rounded-xl px-4 text-sm font-bold text-ink-3">
                Отмена
              </button>
              <button
                type="submit"
                disabled={!rating || sending}
                className="h-11 flex-1 rounded-xl bg-acc text-sm font-bold text-white shadow-[0_3px_0_var(--accSh)] active:translate-y-[3px] active:shadow-none disabled:bg-sf2 disabled:text-ink-3 disabled:shadow-none"
              >
                {rating ? 'Отправить' : 'Поставь оценку'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// свёрнутость админ-меню помним между заходами
/** Строка админ-меню: быстрые суммы + поле для своей суммы */
function AdminGrant({
  icon,
  tint = '',
  label,
  max,
  presets,
  busy,
  onGrant,
}: {
  icon: ReactNode
  tint?: string
  label: string
  max: number
  presets: number[]
  busy: boolean
  onGrant: (amount: number) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const amount = Math.floor(Number(value.replace(/\s/g, '')))
  const valid = Number.isFinite(amount) && amount >= 1 && amount <= max
  const submit = async () => {
    if (!valid || busy) return
    await onGrant(amount)
    setValue('')
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-line bg-bg px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2.5">
          <span className={tint}>{icon}</span>
          <span className="text-sm font-bold">{label}</span>
        </span>
        <div className="flex shrink-0 gap-1.5">
          {presets.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={busy}
              onClick={() => onGrant(amt)}
              className="rounded-lg bg-acc-soft px-2.5 py-1.5 font-mono text-xs font-extrabold text-acc-ink transition-transform active:scale-95 disabled:opacity-50"
            >
              +{amt >= 1000 ? `${amt / 1000}к` : amt}
            </button>
          ))}
        </div>
      </div>
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d\s]/g, ''))}
          placeholder="Своя сумма"
          title={`От 1 до ${max.toLocaleString('ru-RU')}`}
          className="h-9 min-w-0 flex-1 rounded-lg border-[1.5px] border-line bg-sf px-3 font-mono text-sm font-bold text-ink outline-none placeholder:font-sans placeholder:font-medium placeholder:text-ink-3 focus:border-acc"
        />
        <button
          type="submit"
          disabled={!valid || busy}
          className="h-9 shrink-0 rounded-lg bg-acc px-3.5 text-[13px] font-extrabold text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          Начислить
        </button>
      </form>
    </div>
  )
}

type Locks = { buy: boolean; sell: boolean }

/** Блокировка обменника для всех: покупка и продажа монет отдельно */
function ExchangeLock() {
  const [locks, setLocks] = useState<Locks | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<Locks>('/api/admin/exchange-lock')
      .then(setLocks)
      .catch(() => {})
  }, [])

  const toggle = async (side: keyof Locks) => {
    if (!locks || saving) return
    setSaving(true)
    try {
      const next = await api<Locks>('/api/admin/exchange-lock', { body: { [side]: !locks[side] } })
      setLocks(next)
      toast(`${side === 'buy' ? 'Покупка' : 'Продажа'} монет ${next[side] ? 'закрыта' : 'открыта'}`)
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Не получилось')
    } finally {
      setSaving(false)
    }
  }

  const rows: { side: keyof Locks; label: string }[] = [
    { side: 'buy', label: 'XP → монеты' },
    { side: 'sell', label: 'Монеты → XP' },
  ]
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-line bg-bg px-3.5 py-2.5">
      <span className="flex items-center gap-2.5">
        <Coin size={19} />
        <span className="text-sm font-bold">Обменник</span>
        {locks && (locks.buy || locks.sell) && <span className="rounded-md bg-err-soft px-1.5 py-0.5 font-mono text-[10.5px] font-extrabold text-err-ink">ЗАКРЫТ</span>}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {rows.map(({ side, label }) => {
          const off = locks?.[side]
          return (
            <button
              key={side}
              type="button"
              role="switch"
              aria-checked={!off}
              disabled={!locks || saving}
              onClick={() => toggle(side)}
              className={`flex h-10 items-center justify-between gap-2 rounded-lg border-[1.5px] px-2.5 text-[12.5px] font-bold transition-colors disabled:opacity-60 ${off ? 'border-err/40 bg-err-soft text-err-ink' : 'border-line bg-sf text-ink-2'}`}
            >
              <span className="truncate">{label}</span>
              <span className="shrink-0 font-mono text-[10.5px] font-extrabold">{locks ? (off ? 'ВЫКЛ' : 'ВКЛ') : '…'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type FoundUser = { id: string; name: string; email: string | null }

/** Кому выдавать: себе, конкретному игроку (поиск по имени/почте) или всем */
function GrantTargetPicker({ value, onChange }: { value: GrantTarget; onChange: (t: GrantTarget) => void }) {
  const mode = value === 'me' || value === 'all' ? value : 'user'
  const [q, setQ] = useState('')
  const [found, setFound] = useState<FoundUser[]>([])
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    if (!picking || q.trim().length < 2) return setFound([])
    let alive = true
    const t = setTimeout(() => {
      api<{ users: FoundUser[] }>(`/api/admin/users?q=${encodeURIComponent(q.trim())}`)
        .then((r) => alive && setFound(r.users))
        .catch(() => {})
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, picking])

  const tabs: { id: typeof mode; label: string }[] = [
    { id: 'me', label: 'Мне' },
    { id: 'user', label: 'Игроку' },
    { id: 'all', label: 'Всем' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex rounded-xl bg-sf2 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === 'user') setPicking(true)
              else {
                setPicking(false)
                onChange(t.id)
              }
            }}
            className={`h-8 flex-1 rounded-[9px] text-[12.5px] font-bold transition-colors ${(t.id === 'user' ? mode === 'user' || picking : mode === t.id && !picking) ? 'bg-sf text-ink shadow-[0_2px_0_var(--line)]' : 'text-ink-3'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {typeof value === 'object' && !picking && (
        <button type="button" onClick={() => setPicking(true)} className="flex items-center justify-between rounded-lg border-[1.5px] border-acc bg-acc-soft px-3 py-2 text-left">
          <span className="truncate text-[13px] font-bold text-acc-ink">{value.name}</span>
          <span className="shrink-0 text-[12px] font-bold text-acc-ink">сменить</span>
        </button>
      )}
      {picking && (
        <div className="flex flex-col gap-1">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Имя или почта игрока"
            className="h-9 rounded-lg border-[1.5px] border-line bg-sf px-3 text-sm font-bold text-ink outline-none placeholder:font-medium placeholder:text-ink-3 focus:border-acc"
          />
          {found.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onChange({ id: u.id, name: u.name })
                setPicking(false)
                setQ('')
              }}
              className="flex flex-col rounded-lg bg-sf px-3 py-1.5 text-left hover:bg-sf2"
            >
              <span className="truncate text-[13px] font-bold">{u.name}</span>
              {u.email && <span className="truncate font-mono text-[11px] text-ink-3">{u.email}</span>}
            </button>
          ))}
          {q.trim().length >= 2 && !found.length && <span className="px-1 text-[12px] font-semibold text-ink-3">Никого не нашли</span>}
        </div>
      )}
      {value === 'all' && !picking && <span className="px-1 text-[12px] font-semibold text-gold-ink">Начисление уйдёт каждому зарегистрированному игроку</span>}
    </div>
  )
}

const ADMIN_KEY = 'vibely-admin-open'
const readAdminOpen = () => {
  try {
    return localStorage.getItem(ADMIN_KEY) !== '0'
  } catch {
    return true
  }
}

export function ProfileScreen() {
  const me = useGame((s) => s.me)
  const course = useGame((s) => s.course)
  const theme = useGame((s) => s.theme)
  const busy = useGame((s) => s.busy)
  const { go, setTheme, rename, openProject, logout, toggleInfiniteHearts, addAdminXp, addAdminCoins, adminReset, setAvatarFrame, setNameColor } = useGame.getState()
  const [editing, setEditing] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [adminOpen, setAdminOpen] = useState(readAdminOpen)
  const [grantTo, setGrantTo] = useState<GrantTarget>('me')
  // массовая выдача необратима — переспрашиваем
  const grantGuard = (what: string, fn: (amount: number, to: GrantTarget) => Promise<void>) => async (amount: number) => {
    if (grantTo === 'all' && !window.confirm(`Начислить ${amount.toLocaleString('ru-RU')} ${what} всем игрокам?`)) return
    await fn(amount, grantTo)
  }
  const toggleAdmin = () =>
    setAdminOpen((v) => {
      try {
        localStorage.setItem(ADMIN_KEY, v ? '0' : '1')
      } catch {}
      return !v
    })
  if (!me || !course) return null

  const ownedFrames = AVATAR_FRAMES.filter((f) => me.owned.includes(f.id))
  const ownedColors = NAME_COLORS.filter((c) => me.owned.includes(c.id))

  const joined = new Date(me.user.createdAt)
  const units = (['code', 'mkt'] as const).flatMap((t) => course.tracks[t].map((u, i) => ({ unit: u, index: i, track: t })))
  const built = (unitId: string) => me.projects.find((p) => p.unitId === unitId)
  const launched = me.projects.filter((p) => p.ready).length

  const mainStats: { v: ReactNode; l: string; icon: IconName | ReactNode; c?: string }[] = [
    { v: <AnimatedNumber value={me.xpBalance} />, l: 'баланс XP', icon: 'bolt', c: 'var(--acc)' },
    { v: <AnimatedNumber value={me.coins} />, l: plural(me.coins, 'монета', 'монеты', 'монет'), icon: <Coin size={22} /> },
  ]

  const extraStats: { v: ReactNode; l: string; icon: IconName | ReactNode; c?: string }[] = [
    { v: me.streak, l: plural(me.streak, 'день стрика', 'дня стрика', 'дней стрика'), icon: 'flame', c: 'var(--gold)' },
    { v: me.weekXp.toLocaleString('ru-RU'), l: 'XP за неделю', icon: 'league', c: 'var(--code)' },
    { v: me.xp.toLocaleString('ru-RU'), l: 'всего XP за уроки', icon: 'star', c: 'var(--ok)' },
    { v: launched, l: plural(launched, 'проект', 'проекта', 'проектов'), icon: 'rocket', c: 'var(--mkt)' },
  ]

  const ach: { t: string; icon: IconName; c: string; sh: string; open: boolean }[] = [
    { t: 'Первый запуск', icon: 'rocket', c: 'var(--code)', sh: 'var(--codeSh)', open: !!built('c1') },
    { t: '7 дней огня', icon: 'flame', c: 'var(--gold)', sh: 'var(--goldSh)', open: me.maxStreak >= 7 },
    { t: 'Баг-хантер', icon: 'bug', c: 'var(--ok)', sh: 'var(--okSh)', open: me.bugs >= 3 },
    { t: 'Креатор', icon: 'mega', c: 'var(--mkt)', sh: 'var(--mktSh)', open: !!built('m2') },
  ]

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto" style={{ paddingTop: 'var(--top)' }}>
      <div className="mx-auto flex w-full flex-col gap-[18px] px-5 pb-[120px] pt-3 desk:max-w-[984px] desk:px-8 desk:pb-10 desk:pt-6">
        <div className="flex items-center gap-4 desk:gap-5">
          <Avatar name={me.user.name} frame={me.avatarFrame} size={72} className="desk:hidden" />
          <Avatar name={me.user.name} frame={me.avatarFrame} size={96} className="hidden desk:inline-grid" />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            {editing ? (
              <input
                autoFocus
                defaultValue={me.user.name}
                maxLength={24}
                onBlur={async (e) => {
                  const v = e.target.value.trim()
                  if (v && v !== me.user.name) await rename(v)
                  setEditing(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border-2 border-acc bg-sf px-2 py-0.5 font-display text-xl font-bold tracking-[-.02em] text-ink outline-none"
              />
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-2 text-left">
                <StyledName name={me.user.name} color={me.nameColor} className="truncate font-display text-xl font-bold tracking-[-.02em] desk:text-[28px]" />
                <span className="text-ink-3">
                  <Icon name="edit" size={16} />
                </span>
              </button>
            )}
            <span className="truncate font-mono text-[12.5px] text-ink-2">
              в Vibely с {joined.getDate()} {MONTHS_GEN[joined.getMonth()]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Сменить тему"
            className="desk-hide grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[1.5px] border-line bg-sf text-ink-2"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        {ownedFrames.length > 0 && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setAvatarFrame(null)}
              className={`shrink-0 rounded-xl border-[1.5px] px-3 py-1.5 text-[12px] font-bold transition-colors ${
                me.avatarFrame === null ? 'border-acc bg-acc-soft text-acc-ink' : 'border-line bg-sf text-ink-2'
              }`}
            >
              Без рамки
            </button>
            {ownedFrames.map((f) => {
              const active = me.avatarFrame === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAvatarFrame(f.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border-[1.5px] px-2.5 py-1 text-[12px] font-bold transition-colors ${
                    active ? 'border-acc bg-acc-soft text-acc-ink' : 'border-line bg-sf text-ink-2'
                  }`}
                >
                  <Avatar name={me.user.name} frame={f.id} size={22} />
                  <span>{f.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {ownedColors.length > 0 && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setNameColor(null)}
              className={`shrink-0 rounded-xl border-[1.5px] px-3 py-1.5 text-[12px] font-bold transition-colors ${
                me.nameColor === null ? 'border-acc bg-acc-soft text-acc-ink' : 'border-line bg-sf text-ink-2'
              }`}
            >
              Обычное имя
            </button>
            {ownedColors.map((c) => {
              const active = me.nameColor === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNameColor(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 text-[12px] font-bold transition-colors ${
                    active ? 'border-acc bg-acc-soft' : 'border-line bg-sf'
                  }`}
                >
                  <StyledName name={c.name} color={c.id} className="font-extrabold" />
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-[18px] desk:grid desk:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] desk:items-start desk:gap-6">
          <div className="flex flex-col gap-[18px]">
            <EmailCard me={me} />
            <ReviewCard />

            {me.isAdmin && (
              <section className="rounded-unit border-[1.5px] border-acc/30 bg-sf p-3.5">
                <button type="button" onClick={toggleAdmin} aria-expanded={adminOpen} className="flex w-full items-center justify-between font-display text-sm font-bold text-ink-2">
                  <span>Админ</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <AnimatePresence initial={false}>
                  {adminOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2.5 pt-2.5">
                        <button
                          type="button"
                          onClick={() => go('adminStats')}
                          className="flex min-h-[48px] items-center justify-between rounded-xl border-2 border-line bg-bg px-3.5 text-left transition-colors hover:border-acc/40"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name="league" size={19} />
                            <span className="text-sm font-bold">Статистика</span>
                          </span>
                          <span className="rotate-180 text-ink-3">
                            <Icon name="back" size={18} />
                          </span>
                        </button>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={me.infiniteHearts}
                          disabled={busy}
                          onClick={() => toggleInfiniteHearts(!me.infiniteHearts)}
                          className={['flex min-h-[48px] items-center justify-between rounded-xl border-2 px-3.5 text-left transition-colors', me.infiniteHearts ? 'border-ok bg-ok-soft' : 'border-line bg-bg', busy ? 'opacity-60' : ''].join(' ')}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name="heart" size={19} />
                            <span className="text-sm font-bold">Бесконечные сердца</span>
                          </span>
                          <span className={['grid h-7 w-11 place-items-center rounded-full font-mono text-sm font-extrabold', me.infiniteHearts ? 'bg-ok text-white' : 'bg-sf2 text-ink-3'].join(' ')}>
                            {me.infiniteHearts ? '∞' : '○'}
                          </span>
                        </button>
                        <ExchangeLock />
                        <GrantTargetPicker value={grantTo} onChange={setGrantTo} />
                        <AdminGrant
                          icon={<Icon name="bolt" size={19} />}
                          tint="text-acc"
                          label="Накрутка XP"
                          max={100_000}
                          presets={[100, 500, 2500]}
                          busy={busy}
                          onGrant={grantGuard('XP', addAdminXp)}
                        />
                        <AdminGrant icon={<Coin size={19} />} label="Накрутка монет" max={1_000_000} presets={[100, 1000, 10000]} busy={busy} onGrant={grantGuard('монет', addAdminCoins)} />
                        <Button
                          size="md"
                          variant={confirmReset ? 'err' : 'secondary'}
                          disabled={busy}
                          onClick={async () => {
                            if (!confirmReset) {
                              setConfirmReset(true)
                              setTimeout(() => setConfirmReset(false), 3500)
                              return
                            }
                            setConfirmReset(false)
                            await adminReset()
                          }}
                        >
                          <Icon name="refresh" size={18} />
                          <span>{confirmReset ? 'Точно обнулить всё?' : 'Стать нищим'}</span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2.5">
                {(showStats ? [...mainStats, ...extraStats] : mainStats).map((p) => (
                  <div key={p.l} className="flex items-center gap-2.5 rounded-btn border-[1.5px] border-line bg-sf px-3.5 py-3">
                    <div style={p.c ? { color: p.c } : undefined}>
                      {typeof p.icon === 'string' ? <Icon name={p.icon as IconName} size={22} /> : p.icon}
                    </div>
                    <div className="flex flex-col gap-px">
                      <span className="font-display text-[17px] font-bold">{p.v}</span>
                      <span className="text-xs font-semibold text-ink-2">{p.l}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowStats((v) => !v)}
                className="flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[12px] font-bold text-ink-3 transition-colors hover:text-ink-2"
              >
                <span>Подробная статистика</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${showStats ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            <Calendar me={me} />

            <div className="flex flex-col gap-2.5">
              <span className="font-display text-base font-bold">Ачивки</span>
              <div className="grid grid-cols-4 gap-2.5">
                {ach.map((a) => (
                  <div key={a.t} className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className="grid h-[60px] w-[60px] place-items-center rounded-[20px]"
                      style={{
                        background: a.open ? a.c : 'var(--sf2)',
                        color: a.open ? '#fff' : 'var(--ink3)',
                        boxShadow: `0 4px 0 ${a.open ? a.sh : 'var(--lockSh)'}`,
                      }}
                    >
                      <Icon name={a.open ? a.icon : 'lock'} size={28} />
                    </div>
                    <span className={`text-[11.5px] font-bold leading-[1.25] ${a.open ? 'text-ink' : 'text-ink-3'}`}>{a.t}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-display text-base font-bold">Портфолио</span>
            {units.map(({ unit, index, track }) => {
              const f = unit.project.folio
              const p = built(unit.id)
              const done = !!p
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => done && openProject(unit.id)}
                  className={`flex items-center gap-3 rounded-btn border-[1.5px] bg-sf p-3 text-left ${done ? 'border-solid border-line' : 'cursor-default border-dashed border-line opacity-75'}`}
                >
                  <div
                    className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-tile ${done ? (track === 'code' ? 'bg-code-soft text-code-ink' : 'bg-mkt-soft text-mkt-ink') : 'bg-sf2 text-ink-3'}`}
                  >
                    <Icon name={(done ? f.icon : 'lock') as IconName} size={24} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[15px] font-bold">{f.title}</span>
                    <span className="truncate font-mono text-[11.5px] text-ink-2">
                      {done
                        ? p.ready
                          ? 'собран AI · открыть'
                          : 'ждёт сборки · открыть'
                        : `откроется в юните ${index + 1} · ${track === 'code' ? 'вайбкодинг' : 'маркетинг'}`}
                    </span>
                  </div>
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-extrabold ${done ? 'bg-ok-soft text-ok-ink' : 'bg-sf2 text-ink-3'}`}>
                    {done ? f.tag : 'СКОРО'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button type="button" onClick={logout} className="desk-hide self-center py-2 text-[13px] font-semibold text-ink-3 underline-offset-2 hover:underline">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
