import { motion } from 'framer-motion'
import { Fragment, useEffect, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Avatar, StyledName } from '../components/ui/Avatar'
import { api, ApiError } from '../lib/api'
import { plural } from '../lib/date'
import { Icon } from '../lib/icons'
import type { League } from '../lib/types'

const AVATAR_COLORS = ['#7A5CFF', '#F25A35', '#16A34A', '#FFB21E', '#5EC8FF', '#E040A0']
const PROMOTE_TOP = 5
const DEMOTE_LAST = 3

const TIERS: [string, string][] = [
  ['#B9B4C6', '#8E899C'],
  ['#5EC8FF', '#2E9BD6'],
  ['var(--code)', 'var(--codeSh)'],
  ['var(--mkt)', 'var(--mktSh)'],
  ['var(--gold)', 'var(--goldSh)'],
]

function Divider({ up }: { up: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-2 py-2.5 text-[11.5px] font-extrabold tracking-[.06em] ${up ? 'text-ok-ink' : 'text-err-ink'}`}>
      <div className={`h-0.5 flex-1 opacity-40 ${up ? 'bg-ok' : 'bg-err'}`} />
      {up ? 'ЗОНА ПОВЫШЕНИЯ' : 'ЗОНА ПОНИЖЕНИЯ'}
      <div className={`h-0.5 flex-1 opacity-40 ${up ? 'bg-ok' : 'bg-err'}`} />
    </div>
  )
}

/** Лига: реальные юзеры, места по XP за текущую неделю */
export function LeagueScreen() {
  const [league, setLeague] = useState<League | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      api<League>('/api/league')
        .then((l) => alive && (setLeague(l), setError(null)))
        .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не получилось загрузить лигу'))
    load()
    const t = setInterval(load, 30_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const rows = league?.rows ?? []
  // зоны имеют смысл, только когда в лиге достаточно людей
  const showUp = rows.length > PROMOTE_TOP
  const demoteFrom = rows.length >= PROMOTE_TOP + DEMOTE_LAST + 2 ? rows.length - DEMOTE_LAST + 1 : Infinity

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="flex flex-col items-center gap-3 border-b border-line px-5 pb-3.5 pt-3">
        <div className="flex items-end gap-2.5">
          {TIERS.map(([bg, sh], i) => {
            const open = i <= 2
            const s = i === 2 ? 56 : 40
            return (
              <div
                key={i}
                className="grid place-items-center rounded-[30%]"
                style={{
                  width: s,
                  height: s,
                  background: open ? bg : 'var(--sf2)',
                  color: open ? '#fff' : 'var(--ink3)',
                  boxShadow: `0 4px 0 ${open ? sh : 'var(--lockSh)'}`,
                  opacity: i === 2 ? 1 : 0.8,
                }}
              >
                <Icon name={open ? 'league' : 'lock'} size={i === 2 ? 28 : 18} />
              </div>
            )
          })}
        </div>
        <div className="font-display text-[22px] font-extrabold tracking-[-.03em]">Лига Неон</div>
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2">
          Топ-{PROMOTE_TOP} переходят в лигу Квант
          {league && (
            <>
              <span className="text-ink-3">·</span>
              <span className="flex items-center gap-1 font-bold text-gold-ink">
                <Icon name="clock" size={16} />
                {league.daysLeft} {plural(league.daysLeft, 'день', 'дня', 'дней')}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-[110px] pt-2">
        {error && <div className="p-6 text-center text-sm font-semibold text-err-ink">{error}</div>}
        {rows.map((r) => (
          <Fragment key={r.id}>
            {r.rank === demoteFrom && <Divider up={false} />}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${r.me ? 'border-acc bg-acc-soft' : 'border-transparent'}`}
            >
              <span
                className="w-6 text-center font-display text-sm font-bold"
                style={{
                  color: r.rank <= 3 ? 'var(--goldInk)' : r.rank <= PROMOTE_TOP ? 'var(--okInk)' : r.rank >= demoteFrom ? 'var(--errInk)' : 'var(--ink3)',
                }}
              >
                {r.rank}
              </span>
              <Avatar
                name={r.name}
                frame={r.frame}
                size={40}
                bg={r.me ? 'var(--acc)' : AVATAR_COLORS[r.rank % AVATAR_COLORS.length]}
              />
              <span className="flex-1 truncate text-[15px] font-bold">
                <StyledName name={r.name} color={r.nameColor} />
                {r.me && <span className="ml-1 text-xs font-semibold text-ink-2">(ты)</span>}
              </span>
              <span className="font-mono text-[13px] font-bold text-ink-2">{r.xp} XP</span>
            </motion.div>
            {showUp && r.rank === PROMOTE_TOP && <Divider up />}
          </Fragment>
        ))}
        {league && league.total === 1 && (
          <div className="mt-6 flex flex-col items-center gap-2 px-6 text-center">
            <Mascot size={64} mood="wow" />
            <div className="text-sm text-ink-2">Пока в лиге только ты. Позови друзей — соревноваться веселее.</div>
          </div>
        )}
      </div>
    </div>
  )
}
