import { type ReactNode, useState } from 'react'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Avatar, AVATAR_FRAMES, NAME_COLORS, StyledName } from '../components/ui/Avatar'
import { Coin } from '../components/ui/Coin'
import { MONTHS, MONTHS_GEN, plural, WEEKDAYS } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import type { Me } from '../lib/types'
import { useGame } from '../store/game'

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

export function ProfileScreen() {
  const me = useGame((s) => s.me)
  const course = useGame((s) => s.course)
  const theme = useGame((s) => s.theme)
  const busy = useGame((s) => s.busy)
  const { setTheme, rename, openProject, logout, toggleInfiniteHearts, addAdminXp, setAvatarFrame, setNameColor } = useGame.getState()
  const [editing, setEditing] = useState(false)
  const [showStats, setShowStats] = useState(false)
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
      <div className="flex flex-col gap-[18px] px-5 pb-[120px] pt-3">
        <div className="flex items-center gap-4">
          <Avatar name={me.user.name} frame={me.avatarFrame} size={72} />
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
                <StyledName name={me.user.name} color={me.nameColor} className="truncate font-display text-xl font-bold tracking-[-.02em]" />
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[1.5px] border-line bg-sf text-ink-2"
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

        <EmailCard me={me} />

        {me.isAdmin && (
          <section className="flex flex-col gap-2.5 rounded-unit border-[1.5px] border-acc/30 bg-sf p-3.5">
            <div className="font-display text-sm font-bold text-ink-2">Админ</div>
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
            <div className="flex min-h-[48px] items-center justify-between gap-2 rounded-xl border-2 border-line bg-bg px-3.5 py-2">
              <span className="flex items-center gap-2.5">
                <span className="text-acc">
                  <Icon name="bolt" size={19} />
                </span>
                <span className="text-sm font-bold">Накрутка XP</span>
              </span>
              <div className="flex shrink-0 gap-1.5">
                {[100, 500, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={busy}
                    onClick={() => addAdminXp(amt)}
                    className="rounded-lg bg-acc-soft px-2.5 py-1.5 font-mono text-xs font-extrabold text-acc-ink transition-transform active:scale-95 disabled:opacity-50"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>
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

        <button type="button" onClick={logout} className="self-center py-2 text-[13px] font-semibold text-ink-3 underline-offset-2 hover:underline">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
