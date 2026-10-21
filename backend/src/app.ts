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

app.post('/api/auth/register', async (req, res) => {
  const b = parse(RegisterSchema, req.body)
  const key = b.name.toLowerCase()
  if (await one('SELECT 1 FROM users WHERE name_key = ?', [key])) throw bad('Это имя уже занято', 'name-taken')
  const id = crypto.randomUUID()
  await run(
    'INSERT INTO users (id, name, name_key, pass, goal, level, mins, tz, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, b.name, key, await hashPassword(b.password), b.goal ?? null, b.level ?? null, b.mins ?? null, req.tz, Date.now()],
  )
  res.status(201).json({ token: await createSession(id) })
})

app.post('/api/auth/login', async (req, res) => {
  const b = parse(z.object({ name: z.string().trim().min(1, 'Введи имя'), password: z.string().min(1, 'Введи пароль') }), req.body)
  const u = await one<{ id: string; pass: string }>('SELECT id, pass FROM users WHERE name_key = ?', [b.name.toLowerCase()])
  if (!u || !(await checkPassword(b.password, u.pass))) throw new HttpError(401, 'Неверное имя или пароль', 'bad-login')
  res.json({ token: await createSession(u.id) })
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
  const b = parse(z.object({ name: NameSchema.optional(), track: z.enum(['code', 'mkt']).optional() }), req.body)
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
  res.json({ ok: true, ai: !!env.mistralKey, model: env.mistralModel })
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
