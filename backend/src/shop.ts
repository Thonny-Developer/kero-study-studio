import type { UserRow } from './auth.js'
import { all, one, run } from './db.js'
import { MAX_HEARTS, syncHearts } from './game.js'
import { bad, HttpError } from './http.js'

/* ---------- Курс монеты ---------- */

// Цена одной монеты в XP. Курс детерминированный: считается из времени, поэтому
// у всех юзеров одинаковый, а историю не нужно хранить в БД.
const BASE_PRICE = 10
const SWING = 0.35
export const PRICE_STEP = 10 * 60 * 1000

const HOUR = 60 * 60 * 1000

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

export function priceAt(ms: number) {
  const t = Math.floor(ms / PRICE_STEP) * PRICE_STEP
  const v = 0.55 * noise(t, 36 * HOUR, 1) + 0.3 * noise(t, 6 * HOUR, 2) + 0.15 * noise(t, 50 * 60 * 1000, 3)
  return Math.round(BASE_PRICE * (1 + SWING * v) * 100) / 100
}

/** Точки графика [время, цена], последняя — текущий шаг */
function history(now: number, count: number, every: number): [number, number][] {
  const end = Math.floor(now / PRICE_STEP) * PRICE_STEP
  return Array.from({ length: count }, (_, i) => {
    const t = end - (count - 1 - i) * every
    return [t, priceAt(t)]
  })
}

export function rate(now = Date.now()) {
  const price = priceAt(now)
  const dayAgo = priceAt(now - 24 * HOUR)
  return {
    price,
    change: Math.round(((price - dayAgo) / dayAgo) * 1000) / 10,
    nextAt: (Math.floor(now / PRICE_STEP) + 1) * PRICE_STEP,
    day: history(now, 49, 30 * 60 * 1000),
    week: history(now, 57, 3 * HOUR),
  }
}

/* ---------- Товары ---------- */

export const ITEMS = {
  heart: { price: 15, cosmetic: false },
  double: { price: 40, cosmetic: false },
  blink: { price: 120, cosmetic: true },
  frame: { price: 80, cosmetic: true },
} as const

export type ItemId = keyof typeof ITEMS

export const DOUBLE_XP_MS = 30 * 60 * 1000

const COSMETICS = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].cosmetic)

export async function ownedItems(userId: string) {
  const rows = await all<{ item: string }>(
    `SELECT DISTINCT item FROM coin_events WHERE user_id = ? AND kind = 'buy' AND item IN (${COSMETICS.map(() => '?').join(', ')})`,
    [userId, ...COSMETICS],
  )
  return rows.map((r) => r.item)
}

export function shopView() {
  return { ...rate(), items: Object.fromEntries(Object.entries(ITEMS).map(([id, i]) => [id, i.price])) as Record<ItemId, number> }
}

/* ---------- Операции ---------- */

/** Обмен XP на монеты по текущему курсу. Клиент присылает курс, который видел, — если он успел смениться, просим подтвердить заново */
export async function exchange(u: UserRow, body: { coins?: unknown; price?: unknown }) {
  const coins = Number(body.coins)
  if (!Number.isInteger(coins) || coins < 1 || coins > 10_000) throw bad('Укажи, сколько монет нужно')
  const now = Date.now()
  const price = priceAt(now)
  if (Number(body.price) !== price) throw new HttpError(409, `Курс обновился: теперь 1 монета = ${price} XP`, 'price-changed')
  const cost = Math.ceil(coins * price)
  const r = await run(
    `UPDATE users SET coins = coins + ?, xp_spent = xp_spent + ?
     WHERE id = ? AND (SELECT COALESCE(SUM(amount), 0) FROM xp_events WHERE user_id = ?) - xp_spent >= ?`,
    [coins, cost, u.id, u.id, cost],
  )
  if (!r.rowsAffected) throw bad('Не хватает XP для обмена', 'no-xp')
  await run("INSERT INTO coin_events (user_id, kind, amount, xp, price, created_at) VALUES (?, 'exchange', ?, ?, ?, ?)", [u.id, coins, cost, price, now])
  return { coins, cost }
}

export async function buy(u: UserRow, id: unknown) {
  if (typeof id !== 'string' || !(id in ITEMS)) throw bad('Такого товара нет')
  const item = id as ItemId
  const { price } = ITEMS[item]
  const now = Date.now()

  let set = 'coins = coins - ?'
  const args: (number | null)[] = [price]
  let guard = ''
  if (item === 'heart') {
    await syncHearts(u)
    if (u.infinite_hearts) throw bad('У тебя бесконечные сердца', 'hearts-full')
    if (u.hearts >= MAX_HEARTS) throw bad('Сердечки и так полные', 'hearts-full')
    set += `, hearts = hearts + 1, hearts_at = CASE WHEN hearts + 1 >= ${MAX_HEARTS} THEN NULL ELSE hearts_at END`
    guard = ` AND hearts < ${MAX_HEARTS}`
  } else if (item === 'double') {
    // Повторная покупка продлевает активный бонус
    set += ', double_xp_until = MAX(COALESCE(double_xp_until, 0), ?) + ?'
    args.push(now, DOUBLE_XP_MS)
  } else if (await one("SELECT 1 FROM coin_events WHERE user_id = ? AND kind = 'buy' AND item = ?", [u.id, item])) {
    throw bad('Уже куплено', 'owned')
  }

  const r = await run(`UPDATE users SET ${set} WHERE id = ? AND coins >= ?${guard}`, [...args, u.id, price])
  if (!r.rowsAffected) throw bad('Не хватает монет', 'no-coins')
  await run("INSERT INTO coin_events (user_id, kind, amount, item, created_at) VALUES (?, 'buy', ?, ?, ?)", [u.id, -price, item, now])
}
