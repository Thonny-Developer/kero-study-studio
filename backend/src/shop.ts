import type { UserRow } from './auth.js'
import { all, one, run } from './db.js'
import { MAX_HEARTS, syncHearts } from './game.js'
import { bad, HttpError } from './http.js'

/* ---------- Курс монеты (спрос, предложение, сжигание и живой тикер) ---------- */

// Равновесная цена одной монеты в XP.
// Курс живой и обновляется каждые PRICE_STEP (15 секунд) + мгновенно от действий игроков:
// 1) Покупка монет за XP (kind = 'exchange') -> спрос растёт -> курс ВВЕРХ (+1.0 / мон.)
// 2) Продажа монет обратно в XP (kind = 'sell') -> слив монет -> курс ВНИЗ (-1.1 / мон.)
// 3) Покупка товаров за монеты (kind = 'buy') -> монеты СЖИГАЮТСЯ -> курс СИЛЬНО ВНИЗ (-1.35 / мон.)
// 4) Заработок XP в уроках (xp_events, кроме admin) -> приток XP -> курс МЯГКО ВНИЗ (-0.35 / 10 XP)
export const BASE_PRICE = 10
export const MIN_PRICE = 4.0
export const MAX_PRICE = 20.0
export const SELL_SPREAD = 0.06
export const PRICE_STEP = 15 * 1000

const WAVE_SWING = 0.12
const DEMAND_UP_SWING = 0.7
const SUPPLY_DOWN_SWING = 0.45
const MAX_NET = 100

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const DECAY_TAU = 20 * MINUTE
const LOOKBACK = 72 * HOUR

export const IMPULSE_WEIGHTS = {
  buyCoin: 1.0,
  sellCoin: -1.1,
  burnCoin: -1.35,
  lessonXpPerBase: -0.5,
} as const

/** Нелинейный вес пачки монет: чувствителен на малых суммах (1–100 монет) и не переполняется от китов */
export function coinImpact(coins: number, weight: number) {
  return weight * 22 * Math.log1p(Math.max(0, coins) / 12)
}

export interface MarketImpulse {
  at: number
  /** Положительный импульс — спрос (рост цены), отрицательный — предложение/сжигание (снижение цены) */
  impulse: number
}

export interface MarketSummary {
  /** Давление рынка от -100 (сжигание/скидка) до +100 (ажиотажный спрос) */
  pressure: number
  /** Чистый накопленный импульс (в условных монетах) — нужен клиенту для точного предпросмотра сдвига цены */
  netImpulse: number
  /** Куплено монет за XP за 24 часа */
  bought24h: number
  /** Продано монет обратно в XP за 24 часа */
  sold24h: number
  /** Сожжено монет при покупках в магазине за 24 часа */
  burned24h: number
  /** Заработано XP в уроках за 24 часа */
  xp24h: number
}

/** Псевдослучайное 0..1 от целого */
function hash(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** Гладкий шум -1..1 с заданным периодом */
function noise(t: number, period: number, seed: number) {
  const p = t / period
  const i = Math.floor(p)
  const s = (1 - Math.cos((p - i) * Math.PI)) / 2
  return (hash(i * 31 + seed) * (1 - s) + hash((i + 1) * 31 + seed) * s) * 2 - 1
}

function waveAt(ms: number) {
  const t = Math.floor(ms / PRICE_STEP) * PRICE_STEP
  return (
    0.45 * noise(t, 18 * HOUR, 1) +
    0.28 * noise(t, 2 * HOUR, 2) +
    0.17 * noise(t, 12 * MINUTE, 3) +
    0.1 * noise(t, 75 * 1000, 4)
  )
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function clampNet(n: number) {
  return Math.max(-MAX_NET, Math.min(MAX_NET, n))
}

/**
 * Суммарный затухающий импульс рынка на момент ms (-100..+100).
 * Работает как ограниченный интегратор с утечкой: даже если рынок упёрся в потолок или пол,
 * первая же встречная сделка (сжигание в магазине или продажа/покупка) мгновенно сдвигает курс обратно.
 */
function netImpulseAt(ms: number, events: MarketImpulse[]) {
  const stepMs = Math.floor(ms / PRICE_STEP) * PRICE_STEP
  const minAt = stepMs - LOOKBACK
  let net = 0
  let prevAt = minAt
  for (const e of events) {
    if (e.at > ms) break
    if (e.at < minAt) continue
    const at = Math.min(stepMs, e.at)
    if (at > prevAt) {
      net *= Math.exp(-(at - prevAt) / DECAY_TAU)
      prevAt = at
    }
    net = clampNet(net + e.impulse)
  }
  if (stepMs > prevAt) {
    net *= Math.exp(-(stepMs - prevAt) / DECAY_TAU)
  }
  return clampNet(net)
}

function priceFromNet(ms: number, net: number) {
  const w = waveAt(ms)
  const p = clampNet(net) / MAX_NET
  const market = p >= 0 ? DEMAND_UP_SWING * p : SUPPLY_DOWN_SWING * p
  const raw = BASE_PRICE * (1 + WAVE_SWING * w + market)
  return round2(Math.min(MAX_PRICE, Math.max(MIN_PRICE, raw)))
}

export function priceAt(ms: number, events: MarketImpulse[] = []) {
  if (events.length > 0 && ms < events[0].at) return BASE_PRICE
  return priceFromNet(ms, netImpulseAt(ms, events))
}

/** Средняя цена сделки с учётом того, что сам объём сделки сдвигает курс по кривой */
function executionQuote(ms: number, netBefore: number, deltaImpulse: number, sell: boolean) {
  const priceBefore = priceFromNet(ms, netBefore)
  const priceAfter = priceFromNet(ms, clampNet(netBefore + deltaImpulse))
  const avg = (priceBefore + priceAfter) / 2
  const unitPrice = sell ? round2(Math.max(MIN_PRICE * 0.85, avg * (1 - SELL_SPREAD))) : round2(avg)
  return { priceBefore, priceAfter, unitPrice }
}

async function loadMarketData(sinceMs: number, now: number) {
  const [coins, xps] = await Promise.all([
    all<{ kind: string; amount: number; created_at: number }>(
      'SELECT kind, amount, created_at FROM coin_events WHERE created_at >= ? ORDER BY created_at ASC',
      [sinceMs],
    ),
    all<{ amount: number; created_at: number }>(
      "SELECT amount, created_at FROM xp_events WHERE created_at >= ? AND reason != 'admin' ORDER BY created_at ASC",
      [sinceMs],
    ),
  ])

  const dayAgo = now - DAY
  const firstCoinAt = coins.length > 0 ? Number(coins[0].created_at) : 0
  let bought24h = 0
  let sold24h = 0
  let burned24h = 0
  let xp24h = 0
  const events: MarketImpulse[] = []

  for (const c of coins) {
    const amt = Number(c.amount)
    const at = Number(c.created_at)
    if (c.kind === 'exchange' && amt > 0) {
      events.push({ at, impulse: coinImpact(amt, IMPULSE_WEIGHTS.buyCoin) })
      if (at >= dayAgo) bought24h += amt
    } else if (c.kind === 'sell' && amt < 0) {
      const sold = Math.abs(amt)
      events.push({ at, impulse: coinImpact(sold, IMPULSE_WEIGHTS.sellCoin) })
      if (at >= dayAgo) sold24h += sold
    } else if (c.kind === 'buy' && amt < 0) {
      const burned = Math.abs(amt)
      events.push({ at, impulse: coinImpact(burned, IMPULSE_WEIGHTS.burnCoin) })
      if (at >= dayAgo) burned24h += burned
    }
  }

  for (const x of xps) {
    const amt = Number(x.amount)
    const at = Number(x.created_at)
    if (amt > 0 && (!firstCoinAt || at >= firstCoinAt)) {
      events.push({ at, impulse: coinImpact(amt / BASE_PRICE, IMPULSE_WEIGHTS.lessonXpPerBase) })
      if (at >= dayAgo) xp24h += amt
    }
  }

  events.sort((a, b) => a.at - b.at)
  return { events, bought24h, sold24h, burned24h, xp24h }
}

/**
 * Точки графика [время, цена] за окно windowMs.
 * Если реальная история короче windowMs (ещё не набралось 24ч или 7 дней),
 * график строится по фактически накопленному времени от первого события до текущего момента.
 */
function historyWindow(now: number, windowMs: number, count: number, events: MarketImpulse[]): [number, number][] {
  const firstAt = events.length > 0 ? events[0].at : now
  const minSpan = Math.min(windowMs, 2 * MINUTE)
  const start =
    events.length > 0 && now - firstAt < windowMs
      ? Math.max(now - windowMs, Math.min(firstAt - PRICE_STEP, now - minSpan))
      : now - windowMs
  const span = Math.max(PRICE_STEP, now - start)
  return Array.from({ length: count }, (_, i) => {
    const t = i === count - 1 ? now : Math.round(start + (i / (count - 1)) * span)
    return [t, priceAt(t, events)]
  })
}

function pctChange(points: [number, number][], current: number) {
  const startPrice = points[0]?.[1] ?? BASE_PRICE
  return startPrice ? Math.round(((current - startPrice) / startPrice) * 1000) / 10 : 0
}

export async function rate(now = Date.now()) {
  const since = now - 7 * DAY - LOOKBACK
  const { events, bought24h, sold24h, burned24h, xp24h } = await loadMarketData(since, now)
  const netImpulse = round2(netImpulseAt(now, events))
  const price = priceFromNet(now, netImpulse)
  const sellPrice = round2(Math.max(MIN_PRICE * 0.85, price * (1 - SELL_SPREAD)))
  const live = historyWindow(now, 15 * MINUTE, 46, events)
  const day = historyWindow(now, DAY, 49, events)
  const week = historyWindow(now, 7 * DAY, 57, events)
  const pressure = Math.round(netImpulse)
  return {
    price,
    sellPrice,
    change: pctChange(day, price),
    nextAt: (Math.floor(now / PRICE_STEP) + 1) * PRICE_STEP,
    live,
    day,
    week,
    market: {
      pressure,
      netImpulse,
      bought24h,
      sold24h,
      burned24h,
      xp24h,
    } satisfies MarketSummary,
  }
}

/* ---------- Товары ---------- */

export const ITEMS = {
  heart: { price: 15, cosmetic: false },
  double: { price: 40, cosmetic: false },
  blink: { price: 120, cosmetic: true },
  verity: { price: 200, cosmetic: true },
  // Рамки и эффекты аватара
  frame: { price: 80, cosmetic: true },
  frame_emerald: { price: 95, cosmetic: true },
  frame_ice: { price: 135, cosmetic: true },
  frame_neon: { price: 150, cosmetic: true },
  frame_thunder: { price: 165, cosmetic: true },
  frame_sakura: { price: 175, cosmetic: true },
  frame_fire: { price: 180, cosmetic: true },
  frame_glitch: { price: 210, cosmetic: true },
  frame_cosmos: { price: 240, cosmetic: true },
  frame_dragon: { price: 260, cosmetic: true },
  frame_void: { price: 320, cosmetic: true },
  // Окрасы имени
  color_gold: { price: 70, cosmetic: true },
  color_emerald: { price: 85, cosmetic: true },
  color_sunset: { price: 100, cosmetic: true },
  color_ocean: { price: 110, cosmetic: true },
  color_cyber: { price: 140, cosmetic: true },
  color_fire: { price: 160, cosmetic: true },
  color_aurora: { price: 190, cosmetic: true },
  color_royal: { price: 220, cosmetic: true },
} as const

export type ItemId = keyof typeof ITEMS

export const FRAME_IDS = [
  'frame',
  'frame_emerald',
  'frame_ice',
  'frame_neon',
  'frame_thunder',
  'frame_sakura',
  'frame_fire',
  'frame_glitch',
  'frame_cosmos',
  'frame_dragon',
  'frame_void',
] as const
export type FrameId = (typeof FRAME_IDS)[number]

export function isFrameId(id: string): id is FrameId {
  return (FRAME_IDS as readonly string[]).includes(id)
}

/** Скины спутника Блинка */
export const SKIN_IDS = ['blink', 'verity'] as const
export type SkinId = (typeof SKIN_IDS)[number]

export function isSkinId(id: string): id is SkinId {
  return (SKIN_IDS as readonly string[]).includes(id)
}

export const NAME_COLOR_IDS = [
  'color_gold',
  'color_emerald',
  'color_sunset',
  'color_ocean',
  'color_cyber',
  'color_fire',
  'color_aurora',
  'color_royal',
] as const
export type NameColorId = (typeof NAME_COLOR_IDS)[number]

export function isNameColorId(id: string): id is NameColorId {
  return (NAME_COLOR_IDS as readonly string[]).includes(id)
}

export const DOUBLE_XP_MS = 30 * 60 * 1000

const COSMETICS = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].cosmetic)

export async function ownedItems(userId: string) {
  const rows = await all<{ item: string }>(
    `SELECT DISTINCT item FROM coin_events WHERE user_id = ? AND kind = 'buy' AND item IN (${COSMETICS.map(() => '?').join(', ')})`,
    [userId, ...COSMETICS],
  )
  return rows.map((r) => r.item)
}

export async function shopView() {
  return { ...(await rate()), items: Object.fromEntries(Object.entries(ITEMS).map(([id, i]) => [id, i.price])) as Record<ItemId, number> }
}

/* ---------- Операции ---------- */

/** Покупка монет за XP по текущему курсу (с учётом сдвига цены объёмом сделки) */
export async function exchange(u: UserRow, body: { coins?: unknown; price?: unknown }) {
  const coins = Number(body.coins)
  if (!Number.isInteger(coins) || coins < 1 || coins > 10_000) throw bad('Укажи, сколько монет нужно')
  const now = Date.now()
  const { events } = await loadMarketData(now - LOOKBACK - PRICE_STEP, now)
  const netBefore = netImpulseAt(now, events)
  const { priceBefore, unitPrice } = executionQuote(now, netBefore, coinImpact(coins, IMPULSE_WEIGHTS.buyCoin), false)
  const seen = Number(body.price)
  if (Number.isFinite(seen) && seen > 0 && priceBefore > seen * 1.06) {
    throw new HttpError(409, `Курс заметно вырос: теперь 1 монета = ${priceBefore} XP`, 'price-changed')
  }
  const cost = Math.max(1, Math.ceil(coins * unitPrice))
  const r = await run(
    `UPDATE users SET coins = coins + ?, xp_spent = xp_spent + ?
     WHERE id = ? AND (SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ?) - xp_spent >= ?`,
    [coins, cost, u.id, u.id, cost],
  )
  if (!r.rowsAffected) throw bad('Не хватает XP для обмена', 'no-xp')
  await run("INSERT INTO coin_events (user_id, kind, amount, xp, price, created_at) VALUES (?, 'exchange', ?, ?, ?, ?)", [u.id, coins, cost, unitPrice, now])
  return { coins, cost }
}

/** Обратная конвертация: продажа монет в XP (толкает курс монеты вниз) */
export async function sell(u: UserRow, body: { coins?: unknown; price?: unknown }) {
  const coins = Number(body.coins)
  if (!Number.isInteger(coins) || coins < 1 || coins > 10_000) throw bad('Укажи, сколько монет продать')
  const now = Date.now()
  const { events } = await loadMarketData(now - LOOKBACK - PRICE_STEP, now)
  const netBefore = netImpulseAt(now, events)
  const { priceBefore, unitPrice } = executionQuote(now, netBefore, coinImpact(coins, IMPULSE_WEIGHTS.sellCoin), true)
  const seen = Number(body.price)
  if (Number.isFinite(seen) && seen > 0 && priceBefore < seen * 0.94) {
    throw new HttpError(409, `Курс успел снизиться: теперь 1 монета = ${priceBefore} XP`, 'price-changed')
  }
  const xpGained = Math.max(1, Math.floor(coins * unitPrice))
  const r = await run('UPDATE users SET coins = coins - ?, xp_spent = xp_spent - ? WHERE id = ? AND coins >= ?', [coins, xpGained, u.id, coins])
  if (!r.rowsAffected) throw bad('Не хватает монет для продажи', 'no-coins')
  await run("INSERT INTO coin_events (user_id, kind, amount, xp, price, created_at) VALUES (?, 'sell', ?, ?, ?, ?)", [u.id, -coins, xpGained, unitPrice, now])
  return { coins, xp: xpGained }
}

export async function buy(u: UserRow, id: unknown) {
  if (typeof id !== 'string' || !(id in ITEMS)) throw bad('Такого товара нет')
  const item = id as ItemId
  const { price } = ITEMS[item]
  const now = Date.now()

  let set = 'coins = coins - ?'
  const args: (number | string | null)[] = [price]
  let guard = ''
  if (item === 'heart') {
    await syncHearts(u)
    if (u.infinite_hearts) throw bad('У тебя бесконечные сердца', 'hearts-full')
    if (u.hearts >= MAX_HEARTS) throw bad('Сердечки и так полные', 'hearts-full')
    set += `, hearts = hearts + 1, hearts_at = CASE WHEN hearts + 1 >= ${MAX_HEARTS} THEN NULL ELSE hearts_at END`
    guard = ` AND hearts < ${MAX_HEARTS}`
  } else if (item === 'double') {
    // Повторная покупка продлевает активный бонус
    set += ', double_xp_until = CASE WHEN COALESCE(double_xp_until, 0) > ? THEN double_xp_until ELSE ? END + ?'
    args.push(now, now, DOUBLE_XP_MS)
  } else {
    if (await one("SELECT 1 FROM coin_events WHERE user_id = ? AND kind = 'buy' AND item = ?", [u.id, item])) {
      throw bad('Уже куплено', 'owned')
    }
    if (isFrameId(item)) {
      set += ', avatar_frame = ?'
      args.push(item)
    } else if (isNameColorId(item)) {
      set += ', name_color = ?'
      args.push(item)
    } else if (isSkinId(item)) {
      set += ', blink_skin = ?'
      args.push(item)
    }
  }

  const r = await run(`UPDATE users SET ${set} WHERE id = ? AND coins >= ?${guard}`, [...args, u.id, price])
  if (!r.rowsAffected) throw bad('Не хватает монет', 'no-coins')
  await run("INSERT INTO coin_events (user_id, kind, amount, item, created_at) VALUES (?, 'buy', ?, ?, ?)", [u.id, -price, item, now])
}
