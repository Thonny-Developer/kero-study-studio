import { motion } from 'framer-motion'
import { type ReactNode, useEffect, useState } from 'react'
import { Coin } from '../components/ui/Coin'
import { api, ApiError } from '../lib/api'
import { formatDuration, MONTHS_GEN } from '../lib/date'
import { Icon, type IconName } from '../lib/icons'
import type { AdminStats, StatRange } from '../lib/types'
import { useGame } from '../store/game'
import { Stars } from '../components/ui/Stars'
import { CONSUMABLES, DECORS } from './PetScreen'
import { ITEMS } from './ShopScreen'

const RANGES: StatRange[] = [7, 30, 90]

const ITEM_NAMES: Record<string, string> = Object.fromEntries([...ITEMS.map((i) => [i.id, i.name]), ...CONSUMABLES.map((i) => [i.id, i.title]), ...DECORS.map((i) => [i.id, i.title])])

const XP_REASONS: Record<string, string> = {
  lesson: 'Уроки',
  flawless: 'Без ошибок',
  quest: 'Дневной квест',
  project: 'Проекты',
  boost: 'Двойной XP',
  chest: 'Сундуки',
}

const num = (n: number) => (Math.abs(n) >= 10_000 ? `${(n / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}к` : n.toLocaleString('ru-RU'))
const pct = (x: number) => `${Math.round(x * 100)}%`
const dayLabel = (key: string) => {
  const [, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS_GEN[m - 1]}`
}

function Tile({ v, l, icon, c }: { v: ReactNode; l: string; icon?: IconName | ReactNode; c?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-btn border-[1.5px] border-line bg-sf px-3.5 py-3">
      {icon && <div style={c ? { color: c } : undefined}>{typeof icon === 'string' ? <Icon name={icon as IconName} size={20} /> : icon}</div>}
      <div className="flex min-w-0 flex-col gap-px">
        <span className="font-display text-[17px] font-bold">{v}</span>
        <span className="text-xs font-semibold text-ink-2">{l}</span>
      </div>
    </div>
  )
}

/** Столбики по дням. Касание/наведение показывает день в подписи сверху */
function Bars({ days, values, color, describe }: { days: string[]; values: number[]; color: string; describe: (i: number) => string }) {
  const [sel, setSel] = useState<number | null>(null)
  const max = Math.max(1, ...values)
  const i = sel ?? days.length - 1
  const step = Math.max(1, Math.ceil(days.length / 6))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-[12px] font-bold">
        <span className="text-ink-3">{dayLabel(days[i])}</span>
        <span className="truncate text-ink-2">{describe(i)}</span>
      </div>
      <div className="flex h-[120px] items-end gap-[2px]" onPointerLeave={() => setSel(null)}>
        {values.map((v, k) => (
          <div key={days[k]} className="flex h-full flex-1 items-end" onPointerEnter={() => setSel(k)} onPointerDown={() => setSel(k)}>
            <motion.div
              className="w-full rounded-t-[4px]"
              style={{ background: color, opacity: sel === null || sel === k ? 1 : 0.45 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(v ? 3 : 0, (v / max) * 100)}%` }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(k * 0.01, 0.3) }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] font-mono text-[10px] font-bold text-ink-3">
        {days.map((d, k) => (
          <span key={d} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {k % step === 0 ? Number(d.slice(8)) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function Section({ title, icon, c, children }: { title: string; icon: IconName | ReactNode; c?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-unit border-[1.5px] border-line bg-sf p-4">
      <div className="flex items-center gap-2 font-display text-base font-bold">
        <span style={c ? { color: c } : undefined}>{typeof icon === 'string' ? <Icon name={icon as IconName} size={20} /> : icon}</span>
        {title}
      </div>
      {children}
    </section>
  )
}

function Rows({ title, rows }: { title: string; rows: { k: string; l: ReactNode; sub?: string; v: ReactNode }[] }) {
  if (!rows.length) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">{title}</span>
      {rows.map((r) => (
        <div key={r.k} className="flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] font-bold">{r.l}</span>
            {r.sub && <span className="truncate text-[11.5px] font-semibold text-ink-3">{r.sub}</span>}
          </div>
          <span className="shrink-0 font-mono text-[13px] font-bold text-ink-2">{r.v}</span>
        </div>
      ))}
    </div>
  )
}

const tiles = 'grid grid-cols-2 gap-2.5 desk:grid-cols-3'

/** Админ-статистика: заходы, уроки, магазин, XP за выбранный период */
export function AdminStatsScreen() {
  const go = useGame((s) => s.go)
  const isAdmin = useGame((s) => s.me?.isAdmin)
  const [range, setRange] = useState<StatRange>(30)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return go('profile')
    let alive = true
    api<AdminStats>(`/api/admin/stats?range=${range}`)
      .then((s) => alive && (setStats(s), setError(null)))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не получилось загрузить статистику'))
    return () => {
      alive = false
    }
  }, [range, isAdmin, go])

  const s = stats?.range === range ? stats : null
  const days = s?.visits.series.map((d) => d.day) ?? []

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-2.5">
        <button type="button" onClick={() => go('profile')} aria-label="Назад" className="grid h-9 w-9 shrink-0 place-items-center text-ink-3">
          <Icon name="back" size={22} />
        </button>
        <div className="flex-1 font-display text-lg font-bold">Статистика</div>
        <div className="flex shrink-0 rounded-xl bg-sf2 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`h-8 rounded-[9px] px-2.5 text-[12.5px] font-bold transition-colors ${range === r ? 'bg-sf text-ink shadow-[0_2px_0_var(--line)]' : 'text-ink-3'}`}
            >
              {r} д
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 [&>*]:shrink-0">
        {error && !s && <div className="rounded-btn bg-err-soft px-4 py-3 text-sm font-bold text-err-ink">{error}</div>}
        {!s && !error && <div className="py-10 text-center text-sm font-semibold text-ink-3">Считаем…</div>}

        {s && (
          <div className="flex flex-col gap-4 desk:block desk:columns-2 desk:gap-4 desk:[&>*]:mb-4 desk:[&>*]:break-inside-avoid">
            <Section title="Посещения" icon="user" c="var(--acc)">
              <div className={tiles}>
                <Tile v={num(s.visits.today)} l="сегодня" />
                <Tile v={s.visits.dauAvg.toLocaleString('ru-RU')} l="в среднем за день" />
                <Tile v={num(s.visits.wau)} l="за 7 дней" />
                <Tile v={num(s.visits.mau)} l="за 30 дней" />
                <Tile v={num(s.visits.hits)} l={`сессий за ${range} д`} />
                <Tile v={`${num(s.users.total)} / +${num(s.users.newInRange)}`} l="всего юзеров / новых" />
              </div>
              <Bars
                days={days}
                values={s.visits.series.map((d) => d.users)}
                color="var(--acc)"
                describe={(i) => {
                  const d = s.visits.series[i]
                  return `${d.users} чел · ${d.hits} сессий · +${d.newUsers} новых`
                }}
              />
            </Section>

            <Section title="CTR" icon="target" c="var(--code)">
              <div className="flex flex-col gap-2">
                {s.ctr.funnel.map((f) => (
                  <div key={f.id} className="flex flex-col gap-1.5 rounded-xl bg-bg px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13.5px] font-bold">{f.label}</span>
                      <span className="shrink-0 font-display text-[17px] font-bold">{f.ctr === null ? '—' : pct(f.ctr)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sf2">
                      <motion.div
                        className="h-full rounded-full bg-code"
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.ctr ?? 0) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-ink-3">
                      {num(f.to)} из {num(f.from)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">ДОХОДИМОСТЬ УРОКОВ ПО ДНЯМ</span>
              <Bars
                days={days}
                values={s.ctr.lessonSeries.map((d) => (d.opens ? Math.min(1, d.runs / d.opens) : 0))}
                color="var(--code)"
                describe={(i) => {
                  const d = s.ctr.lessonSeries[i]
                  return d.opens ? `${pct(Math.min(1, d.runs / d.opens))} · ${d.runs} из ${d.opens} открытий` : 'нет открытий'
                }}
              />
              <div className="text-[12px] font-semibold text-ink-3">
                За {range} д: {num(s.ctr.lessonOpens)} открытий уроков, {num(s.ctr.shopViews)} просмотров магазина, {num(s.ctr.reviewOpens)} открытий формы отзыва. Считается с момента включения трекинга.
              </div>
            </Section>

            <Section title="Отзывы" icon="star" c="var(--gold)">
              <div className={tiles}>
                <Tile v={s.reviews.total ? s.reviews.avg.toLocaleString('ru-RU') : '—'} l="средняя оценка" icon="star" c="var(--gold)" />
                <Tile v={num(s.reviews.total)} l="отзывов всего" />
                <Tile v={`${num(s.reviews.inRange)}`} l={`за ${range} д`} />
                <Tile v={s.reviews.inRange ? s.reviews.avgInRange.toLocaleString('ru-RU') : '—'} l={`оценка за ${range} д`} />
                <Tile v={num(s.reviews.withText)} l="с текстом" />
                <Tile v={pct(s.reviews.share)} l="юзеров оставили" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">РАСПРЕДЕЛЕНИЕ</span>
                {s.reviews.dist.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2.5 text-[12.5px] font-bold">
                    <span className="flex w-[30px] shrink-0 items-center gap-1 font-mono text-ink-2">
                      {d.stars}
                      <span className="text-gold">
                        <Icon name="star" size={12} />
                      </span>
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
                      <motion.div
                        className="h-full rounded-full bg-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.reviews.total ? (d.count / s.reviews.total) * 100 : 0}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-ink-2">{d.count}</span>
                  </div>
                ))}
              </div>
              {s.reviews.latest.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">ПОСЛЕДНИЕ</span>
                  {s.reviews.latest.map((r, i) => {
                    const d = new Date(r.at)
                    return (
                      <div key={i} className="flex flex-col gap-1 rounded-xl bg-bg px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-[13.5px] font-bold">{r.name}</span>
                          <Stars value={r.rating} size={14} />
                        </div>
                        {r.text && <p className="whitespace-pre-wrap break-words text-[13px] font-medium text-ink-2">{r.text}</p>}
                        <span className="font-mono text-[11px] font-bold text-ink-3">
                          {d.getDate()} {MONTHS_GEN[d.getMonth()]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            <Section title="Уроки" icon="target" c="var(--ok)">
              <div className={tiles}>
                <Tile v={num(s.lessons.runs)} l="прохождений" />
                <Tile v={num(s.lessons.learners)} l="учились" />
                <Tile v={s.lessons.perLearner.toLocaleString('ru-RU')} l="уроков на ученика" />
                <Tile v={pct(s.lessons.accuracy)} l="верных ответов" />
                <Tile v={s.lessons.runs ? pct(s.lessons.flawless / s.lessons.runs) : '—'} l="без ошибок" />
                <Tile v={formatDuration(s.lessons.medianTimeMs)} l="медиана времени" />
              </div>
              <Bars
                days={days}
                values={s.lessons.series.map((d) => d.runs)}
                color="var(--ok)"
                describe={(i) => {
                  const d = s.lessons.series[i]
                  return `${d.runs} уроков · ${d.users} чел`
                }}
              />
              <div className="text-[12px] font-semibold text-ink-3">
                За всё время: {num(s.lessons.allTime)} прохождений, {num(s.lessons.allTimeLearners)} учеников · проектов за период: {s.lessons.projects}
              </div>
              <Rows title="ПОПУЛЯРНЫЕ" rows={s.lessons.top.map((n) => ({ k: n.id, l: n.title, sub: n.unit, v: `${n.runs}×` }))} />
              <Rows title="САМЫЕ СЛОЖНЫЕ" rows={s.lessons.hardest.map((n) => ({ k: n.id, l: n.title, sub: n.unit, v: pct(n.accuracy) }))} />
            </Section>

            <Section title="Магазин" icon={<Coin size={20} />}>
              <div className={tiles}>
                <Tile v={num(s.shop.purchases)} l="покупок" />
                <Tile v={num(s.shop.coinsSpent)} l="монет потрачено" icon={<Coin size={18} />} />
                <Tile v={num(s.shop.buyers)} l="покупателей" />
                <Tile v={s.shop.purchases ? Math.round(s.shop.coinsSpent / s.shop.purchases) : '—'} l="средний чек" />
                <Tile v={`${num(s.shop.exchange.coins)}`} l={`куплено монет · ${num(s.shop.exchange.xp)} XP`} />
                <Tile v={`${num(s.shop.sell.coins)}`} l={`продано монет · ${num(s.shop.sell.xp)} XP`} />
              </div>
              <Bars
                days={days}
                values={s.shop.series.map((d) => d.coins)}
                color="var(--gold)"
                describe={(i) => {
                  const d = s.shop.series[i]
                  return `${d.purchases} покупок · ${d.coins} монет`
                }}
              />
              <Rows title="ТОП ТОВАРОВ" rows={s.shop.top.map((t) => ({ k: t.item, l: ITEM_NAMES[t.item] ?? t.item, sub: `${t.count} шт`, v: num(t.coins) }))} />
            </Section>

            <Section title="XP" icon="bolt" c="var(--acc)">
              <div className={tiles}>
                <Tile v={num(s.xp.total)} l="заработано всего" />
                <Tile v={num(s.xp.median)} l="медиана на юзера" />
                <Tile v={num(s.xp.mean)} l="среднее на юзера" />
                <Tile v={num(s.xp.p90)} l="90-й перцентиль" />
                <Tile v={num(s.xp.inRange)} l={`за ${range} д`} />
                <Tile v={num(s.xp.medianInRange)} l={`медиана за ${range} д`} />
              </div>
              <Bars
                days={days}
                values={s.xp.series.map((d) => d.xp)}
                color="var(--acc)"
                describe={(i) => {
                  const d = s.xp.series[i]
                  return `${num(d.xp)} XP · ${d.users} чел`
                }}
              />
              <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">МЕДИАНА XP АКТИВНОГО ЮЗЕРА ЗА ДЕНЬ</span>
              <Bars
                days={days}
                values={s.xp.series.map((d) => d.median)}
                color="var(--gold)"
                describe={(i) => `медиана ${num(s.xp.series[i].median)} XP`}
              />
              <div className="text-[12px] font-semibold text-ink-3">
                С XP: {s.xp.withXp} из {s.users.total}, медиана по всем — {num(s.xp.medianAll)}, максимум — {num(s.xp.max)}. Админ-накрутка не учтена ({num(s.xp.admin)} XP).
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] font-bold tracking-[.06em] text-ink-3">РАСПРЕДЕЛЕНИЕ</span>
                {s.xp.buckets.map((b) => (
                  <div key={b.label} className="flex items-center gap-2.5 text-[12.5px] font-bold">
                    <span className="w-[74px] shrink-0 font-mono text-ink-2">{b.label}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
                      <motion.div
                        className="h-full rounded-full bg-acc"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.users.total ? (b.users / s.users.total) * 100 : 0}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-ink-2">{b.users}</span>
                  </div>
                ))}
              </div>
              <Rows title="ИСТОЧНИКИ" rows={s.xp.byReason.map((r) => ({ k: r.reason, l: XP_REASONS[r.reason] ?? r.reason, v: num(r.xp) }))} />
              <Rows title="ТОП ЮЗЕРОВ" rows={s.xp.top.map((u, i) => ({ k: `${i}`, l: `${i + 1}. ${u.name}`, v: `${num(u.xp)} XP` }))} />
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
