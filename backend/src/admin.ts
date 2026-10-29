import { findNode } from './content/lessons.js'
import { all, db, one, run, type Stmt } from './db.js'
import { dayKey, shiftDay, weekKey } from './time.js'

// Админ-статистика: посещения, уроки, магазин, XP. Дневные ряды строятся в таймзоне админа.

export const STAT_RANGES = [7, 30, 90] as const
export type StatRange = (typeof STAT_RANGES)[number]

const SESSION_GAP = 30 * 60_000

/**
 * Отмечаем заход: одна строка на юзера в день. Клиент дёргает /api/me раз в минуту,
 * поэтому hits — это сессии: новая, если с прошлой активности прошло больше 30 минут
 */
export async function trackVisit(userId: string, tz: string) {
  const now = Date.now()
  await run(
    `INSERT INTO visits (user_id, day, hits, first_at, last_at) VALUES (?, ?, 1, ?, ?)
     ON CONFLICT (user_id, day) DO UPDATE SET
       hits = visits.hits + CASE WHEN excluded.last_at - visits.last_at > ? THEN 1 ELSE 0 END,
       last_at = excluded.last_at`,
    [userId, dayKey(tz), now, now, SESSION_GAP],
  )
}

export const EVENT_KINDS = ['lesson_open', 'shop_view', 'review_open'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export async function trackEvent(userId: string, kind: EventKind) {
  await run('INSERT INTO events (user_id, kind, created_at) VALUES (?, ?, ?)', [userId, kind, Date.now()])
}

/** Поиск игроков для выдачи: по имени или почте */
export async function findUsers(q: string) {
  const like = `%${q.trim().toLowerCase().replace(/%/g, '')}%`
  const rows = await all<{ id: string; name: string; email: string | null }>(
    'SELECT id, name, email FROM users WHERE name_key LIKE ? OR email_key LIKE ? ORDER BY name_key LIMIT 8',
    [like, like],
  )
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email }))
}

/**
 * Начисление XP или монет одному юзеру или всем. XP пишется с днём и неделей
 * в таймзоне получателя — так же, как обычные начисления (лига, календарь)
 */
export async function grant(kind: 'xp' | 'coins', amount: number, to: { all: true } | { id: string }) {
  const where = 'all' in to ? '' : ' WHERE id = ?'
  const args = 'all' in to ? [] : [to.id]
  const now = Date.now()
  const stmts: Stmt[] = []
  let count: number
  if (kind === 'xp') {
    const zones = await all<{ tz: string; n: number }>(`SELECT tz, COUNT(*) AS n FROM users${where} GROUP BY tz`, args)
    count = zones.reduce((a, z) => a + Number(z.n), 0)
    for (const { tz } of zones) {
      const day = dayKey(tz)
      stmts.push({
        sql: `INSERT INTO xp_events (user_id, amount, reason, day, week, created_at) SELECT id, ?, 'admin', ?, ?, ? FROM users WHERE tz = ?${where.replace(' WHERE', ' AND')}`,
        args: [amount, day, weekKey(day), now, tz, ...args],
      })
    }
  } else {
    count = Number((await one<{ n: number }>(`SELECT COUNT(*) AS n FROM users${where}`, args))?.n ?? 0)
    // kind 'admin' не участвует в расчёте курса обменника
    stmts.push(
      { sql: `UPDATE users SET coins = coins + ?${where}`, args: [amount, ...args] },
      { sql: `INSERT INTO coin_events (user_id, kind, amount, created_at) SELECT id, 'admin', ?, ? FROM users${where}`, args: [amount, now, ...args] },
    )
  }
  if (!count) return 0
  await db().batch(stmts, 'write')
  return count
}

function median(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

function percentile(xs: number[], p: number) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

const XP_BUCKETS: [string, number, number][] = [
  ['0', 0, 0],
  ['1–99', 1, 99],
  ['100–499', 100, 499],
  ['500–1999', 500, 1999],
  ['2000–9999', 2000, 9999],
  ['10к+', 10_000, Infinity],
]

export async function adminStats(tz: string, range: StatRange) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const toDay = (ts: number) => fmt.format(new Date(ts))
  const today = dayKey(tz)
  const days = Array.from({ length: range }, (_, i) => shiftDay(today, i - range + 1))
  const first = days[0]
  // запас в сутки на разницу таймзон, лишнее отсекается по ключу дня
  const since = Date.parse(`${first}T00:00:00Z`) - 86_400_000
  const inRange = (d: string) => d >= first && d <= today
  const series = <T>(make: () => T) => new Map(days.map((d) => [d, make()]))

  const [users, visits, wauRow, mauRow, runs, runsTotal, coins, xpEvents, xpByUser, xpTotals, events, reviews] = await Promise.all([
    all<{ id: string; name: string; created_at: number; email_verified: number }>('SELECT id, name, created_at, email_verified FROM users'),
    all<{ user_id: string; day: string; hits: number }>('SELECT user_id, day, hits FROM visits WHERE day >= ?', [shiftDay(first, -1)]),
    one<{ n: number }>('SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?', [shiftDay(today, -6)]),
    one<{ n: number }>('SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?', [shiftDay(today, -29)]),
    // time_ms = 0 — узлы, проставленные пропуском юнита, это не прохождения
    all<{ user_id: string; node_id: string; kind: string; got: number; mist: number; xp: number; time_ms: number; created_at: number }>(
      "SELECT user_id, node_id, kind, got, mist, xp, time_ms, created_at FROM runs WHERE created_at >= ? AND kind != 'chest' AND time_ms > 0",
      [since],
    ),
    one<{ n: number; u: number }>("SELECT COUNT(*) AS n, COUNT(DISTINCT user_id) AS u FROM runs WHERE kind != 'chest' AND time_ms > 0"),
    all<{ user_id: string; kind: string; amount: number; xp: number; item: string | null; created_at: number }>(
      'SELECT user_id, kind, amount, xp, item, created_at FROM coin_events WHERE created_at >= ?',
      [since],
    ),
    all<{ user_id: string; amount: number; reason: string; created_at: number }>('SELECT user_id, amount, reason, created_at FROM xp_events WHERE created_at >= ?', [since]),
    all<{ user_id: string; xp: number }>("SELECT user_id, SUM(amount) AS xp FROM xp_events WHERE reason != 'admin' GROUP BY user_id"),
    all<{ reason: string; xp: number }>('SELECT reason, SUM(amount) AS xp FROM xp_events GROUP BY reason'),
    all<{ user_id: string; kind: string; created_at: number }>('SELECT user_id, kind, created_at FROM events WHERE created_at >= ?', [since]),
    all<{ user_id: string; rating: number; text: string; created_at: number; updated_at: number }>(
      'SELECT user_id, rating, text, created_at, updated_at FROM reviews ORDER BY updated_at DESC',
    ),
  ])
  const names = new Map(users.map((u) => [u.id, u.name]))

  /* ---------- Посещения ---------- */
  const vs = series(() => ({ users: 0, hits: 0, newUsers: 0 }))
  const visitors = new Set<string>()
  let hits = 0
  for (const v of visits) {
    const s = vs.get(v.day)
    if (!s) continue
    s.users++
    s.hits += v.hits
    hits += v.hits
    visitors.add(v.user_id)
  }
  for (const u of users) {
    const s = vs.get(toDay(u.created_at))
    if (s) s.newUsers++
  }
  const visitSeries = days.map((day) => ({ day, ...vs.get(day)! }))

  /* ---------- Уроки ---------- */
  const ls = series(() => ({ runs: 0, users: new Set<string>() }))
  const perNode = new Map<string, { runs: number; got: number; mist: number }>()
  const learners = new Set<string>()
  let lessonRuns = 0
  let got = 0
  let mist = 0
  let flawless = 0
  let projects = 0
  const times: number[] = []
  for (const r of runs) {
    const s = ls.get(toDay(r.created_at))
    if (!s) continue
    s.runs++
    s.users.add(r.user_id)
    learners.add(r.user_id)
    lessonRuns++
    got += r.got
    mist += r.mist
    if (!r.mist) flawless++
    if (r.kind === 'project') projects++
    times.push(r.time_ms)
    const n = perNode.get(r.node_id) ?? { runs: 0, got: 0, mist: 0 }
    n.runs++
    n.got += r.got
    n.mist += r.mist
    perNode.set(r.node_id, n)
  }
  const nodeRows = [...perNode].map(([id, n]) => {
    const f = findNode(id)
    return { id, title: f?.node.name ?? id, unit: f?.unit.title ?? '', runs: n.runs, accuracy: n.got + n.mist ? n.got / (n.got + n.mist) : 1 }
  })

  /* ---------- Магазин ---------- */
  const ss = series(() => ({ purchases: 0, coins: 0 }))
  const perItem = new Map<string, { count: number; coins: number }>()
  const buyers = new Set<string>()
  let purchases = 0
  let spent = 0
  const exchange = { count: 0, coins: 0, xp: 0 }
  const sell = { count: 0, coins: 0, xp: 0 }
  for (const c of coins) {
    if (!inRange(toDay(c.created_at))) continue
    if (c.kind === 'exchange') {
      exchange.count++
      exchange.coins += c.amount
      exchange.xp += c.xp
    } else if (c.kind === 'sell') {
      sell.count++
      sell.coins -= c.amount
      sell.xp += c.xp
    } else if (c.kind === 'buy') {
      const s = ss.get(toDay(c.created_at))!
      s.purchases++
      s.coins -= c.amount
      purchases++
      spent -= c.amount
      buyers.add(c.user_id)
      const key = c.item ?? '?'
      const it = perItem.get(key) ?? { count: 0, coins: 0 }
      it.count++
      it.coins -= c.amount
      perItem.set(key, it)
    }
  }

  /* ---------- XP ---------- */
  // admin-накрутка в статистику заработка не идёт, показываем её отдельно
  const xs = series(() => new Map<string, number>())
  let earned = 0
  for (const e of xpEvents) {
    if (e.reason === 'admin') continue
    const s = xs.get(toDay(e.created_at))
    if (!s) continue
    s.set(e.user_id, (s.get(e.user_id) ?? 0) + e.amount)
    earned += e.amount
  }
  const xpSeries = days.map((day) => {
    const per = [...xs.get(day)!.values()]
    return { day, xp: per.reduce((a, b) => a + b, 0), users: per.length, median: median(per) }
  })
  const totals = new Map(xpByUser.map((r) => [r.user_id, Number(r.xp)]))
  const allXp = users.map((u) => totals.get(u.id) ?? 0)
  const activeXp = allXp.filter((x) => x > 0)
  const totalXp = activeXp.reduce((a, b) => a + b, 0)
  const rangePerUser = new Map<string, number>()
  for (const m of xs.values()) for (const [id, x] of m) rangePerUser.set(id, (rangePerUser.get(id) ?? 0) + x)

  /* ---------- CTR ---------- */
  // показ -> действие: доля и по людям, и по количеству
  const ev = { lesson_open: [] as string[], shop_view: [] as string[], review_open: [] as string[] }
  const cs = series(() => ({ opens: 0, runs: 0 }))
  for (const e of events) {
    const day = toDay(e.created_at)
    if (!inRange(day) || !(e.kind in ev)) continue
    ev[e.kind as EventKind].push(e.user_id)
    if (e.kind === 'lesson_open') cs.get(day)!.opens++
  }
  for (const [day, s] of ls) cs.get(day)!.runs = s.runs
  const uniq = (xs: string[]) => new Set(xs)
  const rate = (a: number, b: number) => (b ? Math.min(1, a / b) : null)
  const openers = uniq(ev.lesson_open)
  const shoppers = uniq(ev.shop_view)
  const reviewOpeners = uniq(ev.review_open)
  const reviewsInRange = reviews.filter((r) => inRange(toDay(r.updated_at)))
  const newUsers = users.filter((u) => inRange(toDay(u.created_at)))
  const funnel = [
    { id: 'visit_lesson', label: 'Заход → открыл урок', from: visitors.size, to: [...openers].filter((id) => visitors.has(id)).length },
    { id: 'open_finish', label: 'Открыл урок → прошёл', from: ev.lesson_open.length, to: lessonRuns },
    { id: 'shop_buy', label: 'Магазин → покупка', from: shoppers.size, to: [...buyers].filter((id) => shoppers.has(id)).length },
    { id: 'review_send', label: 'Форма отзыва → отправил', from: reviewOpeners.size, to: reviewsInRange.filter((r) => reviewOpeners.has(r.user_id)).length },
    { id: 'signup_verify', label: 'Регистрация → почта', from: newUsers.length, to: newUsers.filter((u) => u.email_verified).length },
  ].map((f) => ({ ...f, ctr: rate(f.to, f.from) }))

  /* ---------- Отзывы ---------- */
  const ratingAvg = (rs: { rating: number }[]) => (rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 100) / 100 : 0)

  return {
    range,
    today,
    users: {
      total: users.length,
      verified: users.filter((u) => u.email_verified).length,
      newInRange: visitSeries.reduce((a, s) => a + s.newUsers, 0),
    },
    visits: {
      series: visitSeries,
      today: vs.get(today)!.users,
      dauAvg: Math.round((visitSeries.reduce((a, s) => a + s.users, 0) / range) * 10) / 10,
      wau: Number(wauRow?.n ?? 0),
      mau: Number(mauRow?.n ?? 0),
      unique: visitors.size,
      hits,
    },
    lessons: {
      series: days.map((day) => ({ day, runs: ls.get(day)!.runs, users: ls.get(day)!.users.size })),
      runs: lessonRuns,
      learners: learners.size,
      allTime: Number(runsTotal?.n ?? 0),
      allTimeLearners: Number(runsTotal?.u ?? 0),
      accuracy: got + mist ? got / (got + mist) : 0,
      flawless,
      projects,
      medianTimeMs: median(times),
      perLearner: learners.size ? Math.round((lessonRuns / learners.size) * 10) / 10 : 0,
      top: [...nodeRows].sort((a, b) => b.runs - a.runs).slice(0, 8),
      hardest: nodeRows.filter((n) => n.runs >= 3).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
    },
    shop: {
      series: days.map((day) => ({ day, ...ss.get(day)! })),
      purchases,
      coinsSpent: spent,
      buyers: buyers.size,
      exchange,
      sell,
      top: [...perItem].map(([item, v]) => ({ item, ...v })).sort((a, b) => b.coins - a.coins).slice(0, 10),
    },
    ctr: {
      funnel,
      lessonSeries: days.map((day) => ({ day, ...cs.get(day)! })),
      shopViews: ev.shop_view.length,
      lessonOpens: ev.lesson_open.length,
      reviewOpens: ev.review_open.length,
    },
    reviews: {
      total: reviews.length,
      avg: ratingAvg(reviews),
      inRange: reviewsInRange.length,
      avgInRange: ratingAvg(reviewsInRange),
      withText: reviews.filter((r) => r.text.trim()).length,
      share: users.length ? reviews.length / users.length : 0,
      dist: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length })),
      latest: reviews.slice(0, 20).map((r) => ({ name: names.get(r.user_id) ?? '—', rating: r.rating, text: r.text, at: r.updated_at })),
    },
    xp: {
      series: xpSeries,
      inRange: earned,
      medianInRange: median([...rangePerUser.values()]),
      total: totalXp,
      admin: Number(xpTotals.find((r) => r.reason === 'admin')?.xp ?? 0),
      mean: activeXp.length ? Math.round(totalXp / activeXp.length) : 0,
      median: median(activeXp),
      medianAll: median(allXp),
      p90: percentile(activeXp, 0.9),
      max: Math.max(0, ...activeXp),
      withXp: activeXp.length,
      byReason: xpTotals
        .filter((r) => r.reason !== 'admin')
        .map((r) => ({ reason: r.reason, xp: Number(r.xp) }))
        .sort((a, b) => b.xp - a.xp),
      buckets: XP_BUCKETS.map(([label, lo, hi]) => ({ label, users: allXp.filter((x) => x >= lo && x <= hi).length })),
      top: [...totals]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, xp]) => ({ name: names.get(id) ?? '—', xp })),
    },
  }
}

export type AdminStats = Awaited<ReturnType<typeof adminStats>>
