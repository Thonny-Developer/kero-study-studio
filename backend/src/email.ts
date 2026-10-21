import crypto from 'node:crypto'
import { createSession, hashPassword, type UserRow } from './auth.js'
import { db, one, run } from './db.js'
import { bad, HttpError } from './http.js'
import { sendMail, type MailKind } from './mail.js'

const TTL_MIN = 15
const MAX_ATTEMPTS = 5
const RESEND_MS = 60_000

interface CodeRow {
  id: number
  user_id: string
  email: string
  code_hash: string
  attempts: number
  expires_at: number
  created_at: number
}

const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
const codeHash = (purpose: MailKind, userId: string, code: string) => hash(`${purpose}:${userId}:${code}`)

export function normEmail(raw: unknown) {
  if (typeof raw !== 'string') throw bad('Укажи почту')
  const email = raw.trim()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad('Похоже, в почте опечатка')
  return { email, key: email.toLowerCase() }
}

async function cooldown(userId: string, purpose: MailKind) {
  const last = await one<{ created_at: number }>(
    'SELECT created_at FROM email_codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1',
    [userId, purpose],
  )
  const wait = last ? last.created_at + RESEND_MS - Date.now() : 0
  if (wait > 0) throw new HttpError(429, `Новый код можно запросить через ${Math.ceil(wait / 1000)} с`, 'cooldown')
}

/** Создаёт код (и ссылку для подтверждения) и отправляет письмо */
async function issue(u: Pick<UserRow, 'id' | 'name'>, purpose: MailKind, email: string, base: string) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  const token = purpose === 'verify' ? crypto.randomBytes(24).toString('base64url') : null
  const now = Date.now()
  await db().batch(
    [
      // старые коды той же цели больше не действуют
      { sql: 'UPDATE email_codes SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL', args: [now, u.id, purpose] },
      {
        sql: 'INSERT INTO email_codes (user_id, purpose, email, code_hash, link_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [u.id, purpose, email, codeHash(purpose, u.id, code), token ? hash(token) : null, now + TTL_MIN * 60_000, now],
      },
    ],
    'write',
  )
  const link = token ? `${base}/api/auth/verify-link?token=${token}` : undefined
  await sendMail(purpose, email, { name: u.name, code, link, minutes: TTL_MIN })
}

/** Последний действующий код; неверный ввод тратит попытку */
async function consume(userId: string, purpose: MailKind, code: unknown): Promise<CodeRow> {
  const row = await one<CodeRow>(
    'SELECT * FROM email_codes WHERE user_id = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1',
    [userId, purpose],
  )
  if (!row || row.expires_at < Date.now()) throw bad('Код истёк — запроси новый', 'code-expired')
  if (row.attempts >= MAX_ATTEMPTS) throw bad('Слишком много попыток — запроси новый код', 'code-attempts')
  const clean = typeof code === 'string' ? code.replace(/\D/g, '') : ''
  const ok = clean.length === 6 && crypto.timingSafeEqual(Buffer.from(codeHash(purpose, userId, clean)), Buffer.from(row.code_hash))
  if (!ok) {
    await run('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?', [row.id])
    const left = MAX_ATTEMPTS - row.attempts - 1
    throw bad(left > 0 ? `Неверный код. Осталось попыток: ${left}` : 'Неверный код. Запроси новый', 'code-wrong')
  }
  await run('UPDATE email_codes SET used_at = ? WHERE id = ?', [Date.now(), row.id])
  return row
}

async function takenByOther(key: string, userId: string) {
  return !!(await one('SELECT 1 FROM users WHERE email_key = ? AND id != ?', [key, userId]))
}

/* ---------- Привязка почты ---------- */

/** Привязать (или сменить) почту и отправить письмо с кодом */
export async function sendVerification(u: UserRow, rawEmail: unknown, base: string) {
  const { email, key } = rawEmail === undefined && u.email ? normEmail(u.email) : normEmail(rawEmail)
  if (await takenByOther(key, u.id)) throw bad('Эта почта уже привязана к другому аккаунту', 'email-taken')
  if (u.email_verified && u.email?.toLowerCase() === key) throw bad('Эта почта уже подтверждена', 'email-verified')
  await cooldown(u.id, 'verify')
  if (u.email?.toLowerCase() !== key) {
    await run('UPDATE users SET email = ?, email_key = ?, email_verified = 0 WHERE id = ?', [email, key, u.id])
  }
  await issue(u, 'verify', email, base)
  return email
}

export async function confirmVerification(u: UserRow, code: unknown) {
  const row = await consume(u.id, 'verify', code)
  if (row.email.toLowerCase() !== (u.email ?? '').toLowerCase()) throw bad('Почта изменилась — запроси новый код', 'code-expired')
  await run('UPDATE users SET email_verified = 1 WHERE id = ?', [u.id])
}

/** Клик по кнопке в письме */
export async function confirmLink(token: unknown) {
  if (typeof token !== 'string' || token.length < 20) return false
  const row = await one<CodeRow>(
    "SELECT * FROM email_codes WHERE link_hash = ? AND purpose = 'verify' AND used_at IS NULL",
    [hash(token)],
  )
  if (!row || row.expires_at < Date.now()) return false
  const u = await one<{ email: string | null }>('SELECT email FROM users WHERE id = ?', [row.user_id])
  if (!u || u.email?.toLowerCase() !== row.email.toLowerCase()) return false
  await db().batch(
    [
      { sql: 'UPDATE email_codes SET used_at = ? WHERE id = ?', args: [Date.now(), row.id] },
      { sql: 'UPDATE users SET email_verified = 1 WHERE id = ?', args: [row.user_id] },
    ],
    'write',
  )
  return true
}

/* ---------- Сброс пароля ---------- */

const resetHits = new Map<string, number[]>()

/** Ответ одинаковый, есть такая почта или нет — чтобы нельзя было перебирать адреса */
export async function sendReset(rawEmail: unknown, ip: string) {
  const { key } = normEmail(rawEmail)
  const now = Date.now()
  const hits = (resetHits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  if (hits.length >= 5) throw new HttpError(429, 'Слишком много запросов. Попробуй через 10 минут', 'rate')
  resetHits.set(ip, [...hits, now])

  const u = await one<UserRow>('SELECT * FROM users WHERE email_key = ?', [key])
  if (!u?.email) return
  await cooldown(u.id, 'reset')
  await issue(u, 'reset', u.email, '')
}

export async function finishReset(rawEmail: unknown, code: unknown, password: string) {
  const { key } = normEmail(rawEmail)
  const u = await one<UserRow>('SELECT * FROM users WHERE email_key = ?', [key])
  if (!u) throw bad('Код истёк — запроси новый', 'code-expired')
  await consume(u.id, 'reset', code)
  // Код пришёл на эту почту — значит, она рабочая
  await db().batch(
    [
      { sql: 'UPDATE users SET pass = ?, email_verified = 1 WHERE id = ?', args: [await hashPassword(password), u.id] },
      { sql: 'DELETE FROM sessions WHERE user_id = ?', args: [u.id] },
    ],
    'write',
  )
  return createSession(u.id)
}
