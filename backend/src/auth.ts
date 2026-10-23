import crypto from 'node:crypto'
import { promisify } from 'node:util'
import type { NextFunction, Request, Response } from 'express'
import { one, run } from './db.js'
import { HttpError } from './http.js'
import { safeTz } from './time.js'

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>

export interface UserRow {
  id: string
  name: string
  email: string | null
  email_verified: number
  goal: string | null
  level: string | null
  mins: number | null
  track: 'code' | 'mkt'
  tz: string
  hearts: number
  hearts_at: number | null
  infinite_hearts: number
  coins: number
  xp_spent: number
  double_xp_until: number | null
  avatar_frame: string | null
  name_color: string | null
  streak: number
  max_streak: number
  last_day: string | null
  bugs: number
  created_at: number
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserRow
    tz: string
  }
}

export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = await scrypt(pw, salt, 64)
  return `${salt}:${hash.toString('hex')}`
}

export async function checkPassword(pw: string, stored: string) {
  const [salt, hex] = stored.split(':')
  if (!salt || !hex) return false
  const hash = await scrypt(pw, salt, 64)
  const ref = Buffer.from(hex, 'hex')
  return ref.length === hash.length && crypto.timingSafeEqual(ref, hash)
}

const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

/** Токен отдаём клиенту, в БД храним только его хэш */
export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [sha(token), userId, Date.now()])
  return token
}

export async function dropSession(token: string) {
  await run('DELETE FROM sessions WHERE token = ?', [sha(token)])
}

export function bearer(req: Request) {
  const h = req.get('authorization') ?? ''
  return h.startsWith('Bearer ') ? h.slice(7) : ''
}

export function withTz(req: Request, _res: Response, next: NextFunction) {
  req.tz = safeTz(req.get('x-timezone'))
  next()
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req)
  if (!token) throw new HttpError(401, 'Нужно войти', 'auth')
  const user = await one<UserRow>('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?', [sha(token)])
  if (!user) throw new HttpError(401, 'Сессия истекла, войди заново', 'auth')
  if (user.tz !== req.tz) {
    await run('UPDATE users SET tz = ? WHERE id = ?', [req.tz, user.id])
    user.tz = req.tz
  }
  req.user = user
  next()
}
