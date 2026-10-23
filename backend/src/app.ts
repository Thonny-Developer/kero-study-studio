import crypto from 'node:crypto'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import * as z from 'zod/v4'
import { bearer, checkPassword, createSession, dropSession, hashPassword, requireUser, withTz, type UserRow } from './auth.js'
import { COURSE, TRACKS } from './content/lessons.js'
import { one, ready, run } from './db.js'
import { env } from './env.js'
import { answer, buildProject, getProject, getState, league, next, openNode, quit, retry, sandbox } from './game.js'
import { bad, HttpError } from './http.js'
import { projectPage } from './page.js'
import { confirmLink, confirmVerification, finishReset, normEmail, sendReset, sendVerification } from './email.js'
import { buy, exchange, isFrameId, isNameColorId, ownedItems, sell, shopView } from './shop.js'
import { dayKey, weekKey } from './time.js'
import { courseView } from './views.js'

export const app = express()
app.set('trust proxy', true)
app.disable('x-powered-by')
app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : true }))
app.use(express.json({ limit: '32kb' }))
app.use(async (_req, _res, next) => {
  await ready()
  next()
})
app.use(withTz)

const user = (req: Request) => req.user as UserRow

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!user(req).email_verified || !env.adminEmails.includes((user(req).email ?? '').trim().toLowerCase()))
    throw new HttpError(403, 'Этот раздел доступен только администратору', 'admin')
  next()
}

/* ---------- Аккаунт ---------- */

const NameSchema = z
  .string()
  .trim()
  .min(2, 'Имя — от 2 символов')
  .max(24, 'Имя — до 24 символов')
  .regex(/^[\p{L}\p{N} ._-]+$/u, 'Только буквы, цифры, пробел и . _ -')
const PassSchema = z.string().min(6, 'Пароль — от 6 символов').max(128)

const RegisterSchema = z.object({
  name: NameSchema,
  email: z.string(),
  password: PassSchema,
  goal: z.enum(['launch', 'job', 'free']).nullish(),
  level: z.enum(['zero', 'some', 'pro']).nullish(),
  mins: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]).nullish(),
})

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body)
  if (!r.success) throw bad(r.error.issues[0]?.message ?? 'Неверные данные')
  return r.data
}

/** Откуда пришёл запрос — на этот адрес ведёт ссылка из письма */
const origin = (req: Request) => `${req.protocol}://${req.get('host')}`

app.post('/api/auth/register', async (req, res) => {
  const b = parse(RegisterSchema, req.body)
  const { email, key: emailKey } = normEmail(b.email)
  const key = b.name.toLowerCase()
  if (await one('SELECT 1 FROM users WHERE name_key = ?', [key])) throw bad('Это имя уже занято', 'name-taken')
  if (await one('SELECT 1 FROM users WHERE email_key = ?', [emailKey])) throw bad('Эта почта уже привязана к другому аккаунту', 'email-taken')
  const id = crypto.randomUUID()
  await run(
    'INSERT INTO users (id, name, name_key, email, email_key, pass, goal, level, mins, tz, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, b.name, key, email, emailKey, await hashPassword(b.password), b.goal ?? null, b.level ?? null, b.mins ?? null, req.tz, Date.now()],
  )
  const token = await createSession(id)
  // Аккаунт создан в любом случае; если письмо не ушло — его можно запросить заново
  let emailSent = true
  try {
    await sendVerification((await one<UserRow>('SELECT * FROM users WHERE id = ?', [id]))!, undefined, origin(req))
  } catch (e) {
    emailSent = false
    console.error('[register] письмо не отправлено:', e instanceof Error ? e.message : e)
  }
  res.status(201).json({ token, emailSent })
})

// Вход по имени или почте
app.post('/api/auth/login', async (req, res) => {
  const b = parse(
    z.object({ login: z.string().trim().min(1, 'Введи имя или почту'), password: z.string().min(1, 'Введи пароль') }),
    { login: req.body?.login ?? req.body?.name, password: req.body?.password },
  )
  const byEmail = b.login.includes('@')
  const u = await one<{ id: string; pass: string }>(`SELECT id, pass FROM users WHERE ${byEmail ? 'email_key' : 'name_key'} = ?`, [
    b.login.toLowerCase(),
  ])
  if (!u || !(await checkPassword(b.password, u.pass)))
    throw new HttpError(401, byEmail ? 'Неверная почта или пароль' : 'Неверное имя или пароль', 'bad-login')
  res.json({ token: await createSession(u.id) })
})

/* ---------- Почта ---------- */

app.post('/api/email/send', requireUser, async (req, res) => {
  const email = await sendVerification(user(req), req.body?.email, origin(req))
  res.json({ email, state: await getState(user(req)) })
})

app.post('/api/email/verify', requireUser, async (req, res) => {
  await confirmVerification(user(req), req.body?.code)
  res.json({ state: await getState(user(req)) })
})

// Кнопка в письме: подтверждаем и возвращаем в приложение
app.get('/api/auth/verify-link', async (req, res) => {
  const ok = await confirmLink(req.query.token)
  res.redirect(302, `${env.appUrl || origin(req)}/?verified=${ok ? 1 : 0}`)
})

app.post('/api/auth/forgot', async (req, res) => {
  await sendReset(req.body?.email, req.ip ?? '')
  res.json({ ok: true })
})

app.post('/api/auth/reset', async (req, res) => {
  const b = parse(z.object({ email: z.string(), code: z.string(), password: PassSchema }), req.body)
  res.json({ token: await finishReset(b.email, b.code, b.password) })
})

app.post('/api/auth/logout', async (req, res) => {
  const token = bearer(req)
  if (token) await dropSession(token)
  res.json({ ok: true })
})

/* ---------- Состояние ---------- */

app.get('/api/course', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300')
  res.json(courseView())
})

app.get('/api/me', requireUser, async (req, res) => {
  res.json(await getState(user(req)))
})

app.patch('/api/me', requireUser, async (req, res) => {
  const b = parse(
    z.object({
      name: NameSchema.optional(),
      track: z.enum(['code', 'mkt']).optional(),
      avatarFrame: z.string().nullable().optional(),
      nameColor: z.string().nullable().optional(),
    }),
    req.body,
  )
  const u = user(req)
  if (b.name && b.name !== u.name) {
    const key = b.name.toLowerCase()
    if (await one('SELECT 1 FROM users WHERE name_key = ? AND id != ?', [key, u.id])) throw bad('Это имя уже занято', 'name-taken')
    await run('UPDATE users SET name = ?, name_key = ? WHERE id = ?', [b.name, key, u.id])
    u.name = b.name
  }
  if (b.track) {
    await run('UPDATE users SET track = ? WHERE id = ?', [b.track, u.id])
    u.track = b.track
  }
  if (b.avatarFrame !== undefined) {
    if (b.avatarFrame === null) {
      await run("UPDATE users SET avatar_frame = 'none' WHERE id = ?", [u.id])
      u.avatar_frame = 'none'
    } else {
      if (!isFrameId(b.avatarFrame)) throw bad('Неизвестная рамка')
      const owned = await ownedItems(u.id)
      if (!owned.includes(b.avatarFrame)) throw bad('Сначала купи эту рамку в магазине')
      await run('UPDATE users SET avatar_frame = ? WHERE id = ?', [b.avatarFrame, u.id])
      u.avatar_frame = b.avatarFrame
    }
  }
  if (b.nameColor !== undefined) {
    if (b.nameColor === null) {
      await run("UPDATE users SET name_color = 'none' WHERE id = ?", [u.id])
      u.name_color = 'none'
    } else {
      if (!isNameColorId(b.nameColor)) throw bad('Неизвестный цвет имени')
      const owned = await ownedItems(u.id)
      if (!owned.includes(b.nameColor)) throw bad('Сначала купи этот цвет в магазине')
      await run('UPDATE users SET name_color = ? WHERE id = ?', [b.nameColor, u.id])
      u.name_color = b.nameColor
    }
  }
  res.json(await getState(u))
})

app.post('/api/admin/infinite-hearts', requireUser, requireAdmin, async (req, res) => {
  const b = parse(z.object({ enabled: z.boolean() }), req.body)
  await run('UPDATE users SET infinite_hearts = ? WHERE id = ?', [b.enabled ? 1 : 0, user(req).id])
  res.json(await getState(user(req)))
})

app.post('/api/admin/xp', requireUser, requireAdmin, async (req, res) => {
  const b = parse(z.object({ amount: z.number().int().min(1).max(100_000).default(500) }), req.body ?? {})
  const u = user(req)
  const today = dayKey(u.tz)
  await run(
    "INSERT INTO xp_events (user_id, amount, reason, day, week, created_at) VALUES (?, ?, 'admin', ?, ?, ?)",
    [u.id, b.amount, today, weekKey(today), Date.now()],
  )
  res.json(await getState(u))
})

/* ---------- Карта и урок ---------- */

app.post('/api/nodes/:id/open', requireUser, async (req, res) => {
  const r = await openNode(user(req), String(req.params.id))
  res.json({ ...r, state: await getState(user(req)) })
})

app.post('/api/lesson/answer', requireUser, async (req, res) => {
  await answer(user(req), req.body ?? {})
  res.json({ state: await getState(user(req)) })
})

app.post('/api/lesson/sandbox', requireUser, async (req, res) => {
  await sandbox(user(req), req.body?.prompt)
  res.json({ state: await getState(user(req)) })
})

app.post('/api/lesson/next', requireUser, async (req, res) => {
  const r = await next(user(req))
  res.json({ ...r, state: await getState(user(req)) })
})

app.post('/api/lesson/quit', requireUser, async (req, res) => {
  await quit(user(req))
  res.json({ state: await getState(user(req)) })
})

app.post('/api/lesson/retry', requireUser, async (req, res) => {
  await retry(user(req))
  res.json({ state: await getState(user(req)) })
})

/* ---------- Магазин ---------- */

app.get('/api/shop', requireUser, async (_req, res) => {
  res.json(await shopView())
})

app.post('/api/shop/exchange', requireUser, async (req, res) => {
  const r = await exchange(user(req), req.body ?? {})
  const [state, shop] = await Promise.all([getState(user(req)), shopView()])
  res.json({ ...r, state, shop })
})

app.post('/api/shop/sell', requireUser, async (req, res) => {
  const r = await sell(user(req), req.body ?? {})
  const [state, shop] = await Promise.all([getState(user(req)), shopView()])
  res.json({ ...r, state, shop })
})

app.post('/api/shop/buy', requireUser, async (req, res) => {
  await buy(user(req), req.body?.item)
  const [state, shop] = await Promise.all([getState(user(req)), shopView()])
  res.json({ state, shop })
})

/* ---------- Лига и проекты ---------- */

app.get('/api/league', requireUser, async (req, res) => {
  res.json(await league(user(req)))
})

const unitParam = (req: Request) => {
  const id = String(req.params.unitId)
  if (!TRACKS.some((t) => COURSE[t].some((u) => u.id === id))) throw bad('Юнит не найден')
  return id
}

app.get('/api/projects/:unitId', requireUser, async (req, res) => {
  res.json(await getProject(user(req), unitParam(req)))
})

app.post('/api/projects/:unitId/build', requireUser, async (req, res) => {
  res.json(await buildProject(user(req), unitParam(req), req.body?.force === true))
})

// Публичная ссылка на проект
app.get('/p/:id', async (req, res) => {
  const page = await projectPage(String(req.params.id))
  if (!page) {
    res.status(404).type('text/plain; charset=utf-8').send('Проект не найден')
    return
  }
  // Сгенерированный HTML открывается в песочнице: без доступа к origin, cookies и localStorage
  res.set('Content-Security-Policy', 'sandbox allow-scripts allow-popups allow-forms')
  res.type('html').send(page)
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: !!env.mistralKey, model: env.mistralModel, mail: !!(env.smtp.host && env.smtp.user) })
})

app.use('/api', (_req, _res) => {
  throw new HttpError(404, 'Не найдено')
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code })
    return
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Неверный JSON' })
    return
  }
  console.error('[vibely]', err)
  res.status(500).json({ error: 'Ошибка сервера' })
})
