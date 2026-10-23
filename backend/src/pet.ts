import type { UserRow } from './auth.js'
import { all, db, one, run } from './db.js'
import { bad } from './http.js'

export type PetFoodId =
  | 'food_cookie'
  | 'food_ramen'
  | 'food_pizza'
  | 'food_burger'
  | 'food_sushi'
  | 'food_cake'

export type PetDrinkId =
  | 'drink_water'
  | 'drink_coffee'
  | 'drink_matcha'
  | 'drink_boba'
  | 'drink_smoothie'
  | 'drink_energy'

export type PetDecorId =
  | 'decor_rug'
  | 'decor_plant'
  | 'decor_lamp'
  | 'decor_poster'
  | 'decor_window'
  | 'decor_garland'
  | 'decor_arcade'
  | 'decor_cat'
  | 'decor_crown'
  | 'decor_glasses'
  | 'decor_shelf'
  | 'decor_desk'
  | 'decor_beanbag'

export type PetConsumableId = PetFoodId | PetDrinkId
export type PetItemId = PetConsumableId | PetDecorId

export interface ConsumableSpec {
  id: PetConsumableId
  kind: 'food' | 'drink'
  price: number
  hunger: number
  thirst: number
  happiness: number
  xp: number
}

export interface DecorSpec {
  id: PetDecorId
  slot: 'floor' | 'left' | 'right' | 'wall' | 'window' | 'ceiling' | 'friend' | 'hat' | 'glasses' | 'desk' | 'seat'
  price: number
  xp: number
}

export const PET_CONSUMABLES: Record<PetConsumableId, ConsumableSpec> = {
  food_cookie: { id: 'food_cookie', kind: 'food', price: 4, hunger: 22, thirst: 0, happiness: 6, xp: 10 },
  food_ramen: { id: 'food_ramen', kind: 'food', price: 9, hunger: 45, thirst: 10, happiness: 14, xp: 25 },
  food_pizza: { id: 'food_pizza', kind: 'food', price: 14, hunger: 70, thirst: 0, happiness: 22, xp: 40 },
  food_burger: { id: 'food_burger', kind: 'food', price: 18, hunger: 85, thirst: 0, happiness: 28, xp: 55 },
  food_sushi: { id: 'food_sushi', kind: 'food', price: 25, hunger: 100, thirst: 5, happiness: 36, xp: 80 },
  food_cake: { id: 'food_cake', kind: 'food', price: 35, hunger: 100, thirst: 0, happiness: 50, xp: 120 },

  drink_water: { id: 'drink_water', kind: 'drink', price: 3, hunger: 0, thirst: 35, happiness: 5, xp: 8 },
  drink_coffee: { id: 'drink_coffee', kind: 'drink', price: 7, hunger: 0, thirst: 50, happiness: 16, xp: 20 },
  drink_matcha: { id: 'drink_matcha', kind: 'drink', price: 11, hunger: 5, thirst: 70, happiness: 24, xp: 32 },
  drink_boba: { id: 'drink_boba', kind: 'drink', price: 16, hunger: 15, thirst: 88, happiness: 32, xp: 48 },
  drink_smoothie: { id: 'drink_smoothie', kind: 'drink', price: 20, hunger: 10, thirst: 100, happiness: 38, xp: 65 },
  drink_energy: { id: 'drink_energy', kind: 'drink', price: 28, hunger: 0, thirst: 100, happiness: 48, xp: 95 },
}

export const PET_DECOR: Record<PetDecorId, DecorSpec> = {
  decor_rug: { id: 'decor_rug', slot: 'floor', price: 15, xp: 30 },
  decor_plant: { id: 'decor_plant', slot: 'left', price: 22, xp: 45 },
  decor_lamp: { id: 'decor_lamp', slot: 'right', price: 26, xp: 50 },
  decor_poster: { id: 'decor_poster', slot: 'wall', price: 30, xp: 60 },
  decor_garland: { id: 'decor_garland', slot: 'ceiling', price: 38, xp: 75 },
  decor_window: { id: 'decor_window', slot: 'window', price: 45, xp: 90 },
  decor_glasses: { id: 'decor_glasses', slot: 'glasses', price: 50, xp: 100 },
  decor_arcade: { id: 'decor_arcade', slot: 'right', price: 55, xp: 110 },
  decor_cat: { id: 'decor_cat', slot: 'friend', price: 65, xp: 130 },
  decor_crown: { id: 'decor_crown', slot: 'hat', price: 75, xp: 150 },
  decor_beanbag: { id: 'decor_beanbag', slot: 'seat', price: 34, xp: 65 },
  decor_shelf: { id: 'decor_shelf', slot: 'left', price: 42, xp: 85 },
  decor_desk: { id: 'decor_desk', slot: 'desk', price: 85, xp: 170 },
}

export function isPetDecorId(x: unknown): x is PetDecorId {
  return typeof x === 'string' && x in PET_DECOR
}

export function isPetConsumableId(x: unknown): x is PetConsumableId {
  return typeof x === 'string' && x in PET_CONSUMABLES
}

const HOUR_MS = 3600_000

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n)))

/** Уровень питомца по накопленному опыту заботы */
export function petLevelInfo(xp: number) {
  // Каждый уровень требует 100 + level * 50 XP
  let level = 1
  let rem = Math.max(0, xp)
  let nextReq = 100
  while (rem >= nextReq) {
    rem -= nextReq
    level++
    nextReq = 100 + (level - 1) * 50
  }
  return { level, xp: Math.max(0, xp), levelXp: rem, nextLevelXp: nextReq }
}

/** Пересчитывает показатели питомца с учётом прошедшего времени */
export async function syncPet(u: UserRow) {
  const now = Date.now()
  const last = u.pet_updated_at ?? now
  const elapsedHours = Math.max(0, (now - last) / HOUR_MS)

  let hunger = u.pet_hunger ?? 80
  let thirst = u.pet_thirst ?? 80
  let happiness = u.pet_happiness ?? 85

  if (elapsedHours >= 0.25) {
    // Показатели плавно снижаются со временем, но не падают в 0 мгновенно
    hunger = clamp(hunger - elapsedHours * 4.5, 12, 100)
    thirst = clamp(thirst - elapsedHours * 5.5, 10, 100)
    happiness = clamp(happiness - elapsedHours * 3.5, 15, 100)
    await run(
      'UPDATE users SET pet_hunger = ?, pet_thirst = ?, pet_happiness = ?, pet_updated_at = ? WHERE id = ?',
      [hunger, thirst, happiness, now, u.id],
    )
    u.pet_hunger = hunger
    u.pet_thirst = thirst
    u.pet_happiness = happiness
    u.pet_updated_at = now
  } else if (u.pet_updated_at === null) {
    await run('UPDATE users SET pet_updated_at = ? WHERE id = ?', [now, u.id])
    u.pet_updated_at = now
  }
}

export async function ownedDecor(userId: string): Promise<PetDecorId[]> {
  const rows = await all<{ item: string }>(
    "SELECT DISTINCT item FROM coin_events WHERE user_id = ? AND kind = 'buy' AND item LIKE 'decor_%'",
    [userId],
  )
  return rows.map((r) => r.item).filter(isPetDecorId)
}

export function parseEquippedDecor(raw: string | null, owned: PetDecorId[]): PetDecorId[] {
  if (!raw) return owned
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is PetDecorId => isPetDecorId(id) && owned.includes(id))
    }
  } catch {
    /* fallback */
  }
  return owned
}

export async function getPetState(u: UserRow) {
  await syncPet(u)
  const owned = await ownedDecor(u.id)
  const equipped = parseEquippedDecor(u.pet_decor, owned)
  const lvl = petLevelInfo(u.pet_xp ?? 0)
  return {
    name: u.pet_name || 'Блинк',
    hunger: u.pet_hunger ?? 80,
    thirst: u.pet_thirst ?? 80,
    happiness: u.pet_happiness ?? 85,
    level: lvl.level,
    xp: lvl.xp,
    levelXp: lvl.levelXp,
    nextLevelXp: lvl.nextLevelXp,
    ownedDecor: owned,
    equippedDecor: equipped,
    prices: {
      ...Object.fromEntries(Object.values(PET_CONSUMABLES).map((c) => [c.id, c.price])),
      ...Object.fromEntries(Object.values(PET_DECOR).map((d) => [d.id, d.price])),
    } as Record<PetItemId, number>,
  }
}

/** Покормить или напоить питомца за монеты */
export async function feedPet(u: UserRow, itemId: unknown) {
  if (!isPetConsumableId(itemId)) throw bad('Неизвестное угощение')
  const spec = PET_CONSUMABLES[itemId]
  await syncPet(u)

  const fresh = await one<UserRow>('SELECT * FROM users WHERE id = ?', [u.id])
  if (!fresh || fresh.coins < spec.price) throw bad('Не хватает монет', 'no-coins')

  const now = Date.now()
  const hunger = clamp((fresh.pet_hunger ?? 80) + spec.hunger, 0, 100)
  const thirst = clamp((fresh.pet_thirst ?? 80) + spec.thirst, 0, 100)
  const happiness = clamp((fresh.pet_happiness ?? 85) + spec.happiness, 0, 100)
  const petXp = (fresh.pet_xp ?? 0) + spec.xp

  const rs = await db().batch(
    [
      {
        sql: 'UPDATE users SET coins = coins - ?, pet_hunger = ?, pet_thirst = ?, pet_happiness = ?, pet_xp = ?, pet_updated_at = ? WHERE id = ? AND coins >= ?',
        args: [spec.price, hunger, thirst, happiness, petXp, now, u.id, spec.price],
      },
      {
        sql: "INSERT INTO coin_events (user_id, kind, amount, xp, item, created_at) VALUES (?, 'buy', ?, 0, ?, ?)",
        args: [u.id, -spec.price, spec.id, now],
      },
    ],
    'write',
  )
  if (rs[0].rowsAffected === 0) throw bad('Не хватает монет', 'no-coins')
}

/** Купить предмет декора для комнаты питомца */
export async function buyPetDecor(u: UserRow, itemId: unknown) {
  if (!isPetDecorId(itemId)) throw bad('Неизвестный декор')
  const spec = PET_DECOR[itemId]
  const owned = await ownedDecor(u.id)
  if (owned.includes(itemId)) throw bad('Этот декор уже куплен')

  const fresh = await one<UserRow>('SELECT * FROM users WHERE id = ?', [u.id])
  if (!fresh || fresh.coins < spec.price) throw bad('Не хватает монет', 'no-coins')

  // При покупке автоматически ставим в комнату (заменяя предмет в том же слоте, если он был)
  const currentEquipped = parseEquippedDecor(fresh.pet_decor, owned)
  const nextEquipped = [
    ...currentEquipped.filter((id) => PET_DECOR[id].slot !== spec.slot),
    itemId,
  ]

  const now = Date.now()
  const happiness = clamp((fresh.pet_happiness ?? 85) + 20, 0, 100)
  const petXp = (fresh.pet_xp ?? 0) + spec.xp

  const rs = await db().batch(
    [
      {
        sql: 'UPDATE users SET coins = coins - ?, pet_happiness = ?, pet_xp = ?, pet_decor = ?, pet_updated_at = ? WHERE id = ? AND coins >= ?',
        args: [spec.price, happiness, petXp, JSON.stringify(nextEquipped), now, u.id, spec.price],
      },
      {
        sql: "INSERT INTO coin_events (user_id, kind, amount, xp, item, created_at) VALUES (?, 'buy', ?, 0, ?, ?)",
        args: [u.id, -spec.price, spec.id, now],
      },
    ],
    'write',
  )
  if (rs[0].rowsAffected === 0) throw bad('Не хватает монет', 'no-coins')
}

/** Включить или выключить купленный декор в комнате */
export async function togglePetDecor(u: UserRow, itemId: unknown) {
  if (!isPetDecorId(itemId)) throw bad('Неизвестный декор')
  const owned = await ownedDecor(u.id)
  if (!owned.includes(itemId)) throw bad('Сначала купи этот декор')

  const fresh = (await one<UserRow>('SELECT * FROM users WHERE id = ?', [u.id])) ?? u
  const current = parseEquippedDecor(fresh.pet_decor, owned)
  const spec = PET_DECOR[itemId]

  let next: PetDecorId[]
  if (current.includes(itemId)) {
    next = current.filter((id) => id !== itemId)
  } else {
    next = [...current.filter((id) => PET_DECOR[id].slot !== spec.slot), itemId]
  }
  await run('UPDATE users SET pet_decor = ? WHERE id = ?', [JSON.stringify(next), u.id])
}

/** Погладить питомца или переименовать */
export async function playWithPet(u: UserRow, name?: string) {
  await syncPet(u)
  const fresh = (await one<UserRow>('SELECT * FROM users WHERE id = ?', [u.id])) ?? u
  if (name !== undefined) {
    const clean = name.trim().slice(0, 18)
    if (clean.length < 2) throw bad('Имя питомца — от 2 символов')
    await run('UPDATE users SET pet_name = ? WHERE id = ?', [clean, u.id])
    return
  }
  const now = Date.now()
  const happiness = clamp((fresh.pet_happiness ?? 85) + 6, 0, 100)
  const petXp = (fresh.pet_xp ?? 0) + 4
  await run('UPDATE users SET pet_happiness = ?, pet_xp = ?, pet_updated_at = ? WHERE id = ?', [
    happiness,
    petXp,
    now,
    u.id,
  ])
}

