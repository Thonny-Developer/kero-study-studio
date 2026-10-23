import crypto from 'node:crypto'
import type { InStatement } from '@libsql/client'
import type { UserRow } from './auth.js'
import { findNode, trackNodes } from './content/lessons.js'
import { LEARNING } from './content/learning.js'
import type { LessonNode, Task, Track } from './content/types.js'
import { all, db, one, run } from './db.js'
import { env } from './env.js'
import { bad, HttpError } from './http.js'
import { buildArtifact, gradePrompt } from './mistral.js'
import { dayKey, shiftDay, weekday, weekKey } from './time.js'
import { ownedItems } from './shop.js'
import { publicTask, type PublicTask } from './views.js'

export const MAX_HEARTS = 5
/** Одно сердечко восстанавливается за 10 минут */
export const HEART_MS = 10 * 60 * 1000
export const XP_PER_TASK = 10
export const XP_LESSON = 5
export const XP_FLAWLESS = 15
export const XP_QUEST = 15
export const XP_PROJECT = 50
export const QUEST_GOAL = 2
export const SB_PASS = 60

export interface Feedback {
  correct: boolean
  title: string
  text: string
  /** правильный ответ при ошибке или улучшенный промпт в песочнице */
  answer?: string
  correctIndex?: number
  right?: string[]
  score?: number
  xp: number
}

interface ActiveRow {
  user_id: string
  node_id: string
  idx: number
  got: number
  mist: number
  xp: number
  started_at: number
  checked: number
  feedback: string | null
  answer: string | null
  sb_prompt: string | null
  queue: string | null
}

interface Answer {
  sel?: number
  chosen?: string[]
  prompt?: string
}

export interface LessonResult {
  nodeId: string
  unitId: string
  track: Track
  isProject: boolean
  earned: number
  flawlessBonus: number
  questBonus: number
  projectBonus: number
  boostBonus: number
  accuracy: number
  timeMs: number
  streak: number
}

const sbXp = (score: number) => Math.round(score / 10) * 2

function lessonOf(nodeId: string) {
  const f = findNode(nodeId)
  if (!f || f.node.kind === 'chest') throw bad('Урок не найден')
  return { f, lesson: f.node as LessonNode }
}

/* ---------- Сердечки ---------- */

export async function syncHearts(u: UserRow) {
  if (u.infinite_hearts) {
    if (u.hearts !== MAX_HEARTS || u.hearts_at !== null) {
      await run('UPDATE users SET hearts = ?, hearts_at = NULL WHERE id = ?', [MAX_HEARTS, u.id])
      u.hearts = MAX_HEARTS
      u.hearts_at = null
    }
    return
  }
  if (u.hearts >= MAX_HEARTS) return
  const now = Date.now()
  const start = u.hearts_at ?? now
  const gained = Math.floor((now - start) / HEART_MS)
  const hearts = Math.min(MAX_HEARTS, u.hearts + gained)
  const at = hearts >= MAX_HEARTS ? null : start + gained * HEART_MS
  if (hearts !== u.hearts || at !== u.hearts_at) {
    await run('UPDATE users SET hearts = ?, hearts_at = ? WHERE id = ?', [hearts, at, u.id])
    u.hearts = hearts
    u.hearts_at = at
  }
}

/* ---------- Состояние юзера ---------- */

interface RunRow {
  node_id: string
  unit_id: string
  kind: string
  got: number
  xp: number
  day: string
}

async function progress(userId: string) {
  const runs = await all<RunRow>('SELECT node_id, unit_id, kind, got, xp, day FROM runs WHERE user_id = ?', [userId])
  return { runs, done: new Set(runs.map((r) => r.node_id)) }
}

function currentNode(done: Set<string>, track: Track) {
  return trackNodes(track).find((f) => !done.has(f.node.id))?.node.id ?? null
}

function liveStreak(u: UserRow, today: string) {
  return u.last_day === today || u.last_day === shiftDay(today, -1) ? u.streak : 0
}

function taskQueue(a: ActiveRow, lesson: LessonNode): number[] {
  if (a.queue) {
    try {
      const parsed = JSON.parse(a.queue)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      /* fallback */
    }
  }
  return Array.from({ length: lesson.tasks.length }, (_, i) => i)
}

function lessonView(a: ActiveRow) {
  const { f, lesson } = lessonOf(a.node_id)
  const queue = taskQueue(a, lesson)
  const taskIdx = queue[a.idx] ?? 0
  const task = lesson.tasks[taskIdx] ?? lesson.tasks[0]
  return {
    nodeId: a.node_id,
    name: lesson.name,
    kind: lesson.kind,
    track: f.track,
    unitId: f.unit.id,
    study: LEARNING[f.node.id] ?? {
      intro: lesson.name + ' — завершающий проект этого модуля. Собери решение вокруг понятной задачи и выбери один результат, который можно показать или проверить.',
      example: 'Сначала сформулируй для кого и какую задачу решает проект. Затем сделай минимальную рабочую версию и проверь её на реальном сценарии.',
      practice: 'Опиши свою идею проекта: кому она нужна, какую проблему решает и что будет готовым результатом.',
      sample: 'Для начинающих дизайнеров: страница портфолио с тремя работами и формой связи; готовность — ссылки открываются, форма отправляет заявку.',
    },
    idx: a.idx,
    total: lesson.tasks.length,
    got: a.got,
    mist: a.mist,
    xp: a.xp,
    startedAt: a.started_at,
    task: publicTask(task) as PublicTask,
    checked: !!a.checked,
    answer: a.answer ? (JSON.parse(a.answer) as Answer) : null,
    feedback: a.feedback ? (JSON.parse(a.feedback) as Feedback) : null,
  }
}

export async function getState(stale: UserRow) {
  // Действия выше пишут в БД напрямую — берём свежую строку
  const u = (await one<UserRow>('SELECT * FROM users WHERE id = ?', [stale.id])) ?? stale
  await syncHearts(u)
  const today = dayKey(u.tz)
  const week = weekKey(today)
  const [{ runs, done }, totals, active, projects, quest, owned] = await Promise.all([
    progress(u.id),
    one<{ xp: number; week_xp: number }>(
      'SELECT COALESCE(SUM(amount), 0) AS xp, COALESCE(SUM(CASE WHEN week = ? THEN amount END), 0) AS week_xp FROM xp_events WHERE user_id = ?',
      [week, u.id],
    ),
    one<ActiveRow>('SELECT * FROM active_lessons WHERE user_id = ?', [u.id]),
    all<{ id: string; unit_id: string; kind: string; ready: number }>(
      'SELECT id, unit_id, kind, output IS NOT NULL AS ready FROM projects WHERE user_id = ? ORDER BY created_at',
      [u.id],
    ),
    one("SELECT 1 FROM xp_events WHERE user_id = ? AND reason = 'quest' AND day = ?", [u.id, today]),
    ownedItems(u.id),
  ])

  const units: Record<string, { lessons: number; tasks: number; xp: number }> = {}
  const seen = new Set<string>()
  for (const r of runs) {
    const s = (units[r.unit_id] ??= { lessons: 0, tasks: 0, xp: 0 })
    s.tasks += r.got
    s.xp += r.xp
    if (r.kind !== 'chest' && !seen.has(r.node_id)) {
      seen.add(r.node_id)
      s.lessons++
    }
  }

  return {
    user: { id: u.id, name: u.name, email: u.email, emailVerified: !!u.email_verified, goal: u.goal, level: u.level, mins: u.mins, track: u.track, createdAt: u.created_at },
    isAdmin: !!u.email_verified && env.adminEmails.includes((u.email ?? '').trim().toLowerCase()),
    infiniteHearts: !!u.infinite_hearts,
    xp: Number(totals?.xp ?? 0),
    xpBalance: Math.max(0, Number(totals?.xp ?? 0) - u.xp_spent),
    coins: u.coins,
    owned,
    doubleXpUntil: (u.double_xp_until ?? 0) > Date.now() ? u.double_xp_until : null,
    weekXp: Number(totals?.week_xp ?? 0),
    hearts: u.hearts,
    heartsAt: u.hearts_at,
    heartMs: HEART_MS,
    maxHearts: MAX_HEARTS,
    streak: liveStreak(u, today),
    maxStreak: u.max_streak,
    bugs: u.bugs,
    today,
    days: [...new Set(runs.map((r) => r.day))].sort(),
    todayLessons: runs.filter((r) => r.day === today && r.kind !== 'chest').length,
    questGoal: QUEST_GOAL,
    questXp: XP_QUEST,
    questDone: !!quest,
    done: [...done],
    units,
    projects: projects.map((p) => ({ id: p.id, unitId: p.unit_id, kind: p.kind, ready: !!p.ready })),
    lesson: active ? lessonView(active) : null,
  }
}

/* ---------- Карта ---------- */

export type OpenResult = { open: 'lesson' | 'noHearts' } | { open: 'project'; unitId: string } | { open: 'chest'; toast: string }

export async function openNode(u: UserRow, nodeId: string): Promise<OpenResult> {
  const f = findNode(nodeId)
  if (!f) throw bad('Узел не найден')
  const { done } = await progress(u.id)
  const isDone = done.has(nodeId)
  if (!isDone && currentNode(done, f.track) !== nodeId) throw bad('Сначала пройди предыдущие уроки', 'locked')

  if (f.node.kind === 'chest') {
    if (isDone) return { open: 'chest', toast: 'Сундук уже открыт' }
    const day = dayKey(u.tz)
    await db().batch(
      [
        { sql: "INSERT INTO runs (user_id, node_id, unit_id, kind, xp, day, created_at) VALUES (?, ?, ?, 'chest', ?, ?, ?)", args: [u.id, nodeId, f.unit.id, f.node.xp, day, Date.now()] },
        { sql: "INSERT INTO xp_events (user_id, amount, reason, node_id, day, week, created_at) VALUES (?, ?, 'chest', ?, ?, ?, ?)", args: [u.id, f.node.xp, nodeId, day, weekKey(day), Date.now()] },
      ],
      'write',
    )
    return { open: 'chest', toast: `Сундук открыт: +${f.node.xp} XP` }
  }

  if (f.node.kind === 'project' && isDone) return { open: 'project', unitId: f.unit.id }

  await syncHearts(u)
  if (u.hearts <= 0) {
    const existing = await one<ActiveRow>('SELECT * FROM active_lessons WHERE user_id = ?', [u.id])
    if (!existing) {
      await run('INSERT INTO active_lessons (user_id, node_id, started_at) VALUES (?, ?, ?)', [u.id, nodeId, Date.now()])
    }
    await run('UPDATE users SET track = ? WHERE id = ?', [f.track, u.id])
    return { open: 'noHearts' }
  }
  await db().batch(
    [
      { sql: 'INSERT OR REPLACE INTO active_lessons (user_id, node_id, started_at) VALUES (?, ?, ?)', args: [u.id, nodeId, Date.now()] },
      { sql: 'UPDATE users SET track = ? WHERE id = ?', args: [f.track, u.id] },
    ],
    'write',
  )
  return { open: 'lesson' }
}

/* ---------- Урок ---------- */

async function activeOf(u: UserRow) {
  const a = await one<ActiveRow>('SELECT * FROM active_lessons WHERE user_id = ?', [u.id])
  if (!a) throw new HttpError(409, 'Нет активного урока', 'no-lesson')
  const { f, lesson } = lessonOf(a.node_id)
  const queue = taskQueue(a, lesson)
  const taskIdx = queue[a.idx] ?? 0
  return { a, f, lesson, queue, taskIdx, task: (lesson.tasks[taskIdx] ?? lesson.tasks[0]) as Task }
}

export async function answer(u: UserRow, body: Answer) {
  const { a, task, queue, taskIdx } = await activeOf(u)
  if (a.checked) throw new HttpError(409, 'Ответ уже проверен', 'checked')
  if (task.type === 'sb') throw bad('Это задание оценивает AI')
  await syncHearts(u)
  if (u.hearts <= 0) throw new HttpError(409, 'Сердечки закончились', 'no-hearts')

  let ok: boolean
  let given: Answer
  if (task.type === 'asm') {
    const chosen = Array.isArray(body.chosen) ? body.chosen.filter((id) => typeof id === 'string' && id in task.blocks) : []
    if (!chosen.length) throw bad('Собери хотя бы один блок')
    ok = chosen.join(',') === task.right.join(',')
    given = { chosen }
  } else {
    const sel = Number(body.sel)
    const max = task.type === 'bug' ? task.lines.length : task.options.length
    if (!Number.isInteger(sel) || sel < 0 || sel >= max) throw bad('Выбери вариант')
    ok = sel === task.correct
    given = { sel }
  }

  const fb: Feedback = ok
    ? { correct: true, title: task.okTitle ?? 'Верно!', text: task.okText, xp: XP_PER_TASK }
    : { correct: false, title: 'Почти! Давай разберём', text: task.badText, answer: task.answer, xp: 0 }
  if (task.type === 'asm') fb.right = task.right
  else fb.correctIndex = task.correct

  const hearts = u.infinite_hearts ? MAX_HEARTS : ok ? u.hearts : u.hearts - 1
  const nextQueue = ok ? queue : [...queue, taskIdx]
  await db().batch(
    [
      {
        sql: 'UPDATE users SET hearts = ?, hearts_at = ?, bugs = bugs + ? WHERE id = ?',
        args: [hearts, u.infinite_hearts ? null : !ok && u.hearts_at === null ? Date.now() : u.hearts_at, ok && task.type === 'bug' ? 1 : 0, u.id],
      },
      {
        sql: 'UPDATE active_lessons SET checked = 1, got = got + ?, mist = mist + ?, xp = xp + ?, feedback = ?, answer = ?, queue = ? WHERE user_id = ?',
        args: [ok ? 1 : 0, ok ? 0 : 1, fb.xp, JSON.stringify(fb), JSON.stringify(given), JSON.stringify(nextQueue), u.id],
      },
    ],
    'write',
  )
}

/* Песочница: оценка Mistral. Сердечки не тратит. */
const aiCalls = new Map<string, number[]>()

export function aiRateLimit(userId: string) {
  const now = Date.now()
  const recent = (aiCalls.get(userId) ?? []).filter((t) => now - t < 60_000)
  if (recent.length >= 8) throw new HttpError(429, 'Слишком часто. Подожди минуту', 'rate')
  recent.push(now)
  aiCalls.set(userId, recent)
}

function sbTitle(score: number) {
  if (score >= 80) return 'Промпт огонь — AI понял тебя с первого раза'
  if (score >= SB_PASS) return 'Норм промпт, можно острее'
  return 'AI немного растерялся'
}

export async function sandbox(u: UserRow, prompt: unknown) {
  const { a, f, task, queue, taskIdx } = await activeOf(u)
  if (a.checked) throw new HttpError(409, 'Ответ уже проверен', 'checked')
  if (task.type !== 'sb') throw bad('Это не песочница')
  if (typeof prompt !== 'string' || prompt.trim().length < 10) throw bad('Напиши промпт хотя бы в 10 символов')
  const text = prompt.trim().slice(0, 2000)
  aiRateLimit(u.id)

  const grade = await gradePrompt(text, task.task, f.track)
  const ok = grade.score >= SB_PASS
  const fb: Feedback = {
    correct: ok,
    title: sbTitle(grade.score),
    text: grade.feedback,
    answer: grade.improved,
    score: grade.score,
    xp: ok ? sbXp(grade.score) : 0,
  }
  const nextQueue = ok ? queue : [...queue, taskIdx]
  await run(
    'UPDATE active_lessons SET checked = 1, got = got + ?, mist = mist + ?, xp = xp + ?, feedback = ?, answer = ?, sb_prompt = ?, queue = ? WHERE user_id = ? AND checked = 0',
    [ok ? 1 : 0, ok ? 0 : 1, fb.xp, JSON.stringify(fb), JSON.stringify({ prompt: text }), text, JSON.stringify(nextQueue), u.id],
  )
}

export async function next(u: UserRow): Promise<{ result?: LessonResult; noHearts?: boolean }> {
  const { a, f, lesson, queue } = await activeOf(u)
  if (!a.checked) throw new HttpError(409, 'Сначала проверь ответ', 'not-checked')
  await syncHearts(u)

  if (a.idx + 1 < queue.length) {
    await run('UPDATE active_lessons SET idx = idx + 1, checked = 0, feedback = NULL, answer = NULL WHERE user_id = ?', [u.id])
    return u.hearts <= 0 ? { noHearts: true } : {}
  }
  if (u.hearts <= 0) return { noHearts: true }

  // Урок закончен: начисляем XP, обновляем стрик, квест и проект
  const now = Date.now()
  const today = dayKey(u.tz)
  const week = weekKey(today)
  const { runs, done } = await progress(u.id)
  const firstTime = !done.has(a.node_id)
  const isProject = lesson.kind === 'project'
  const lessonsToday = runs.filter((r) => r.day === today && r.kind !== 'chest').length + 1
  const questDone = !!(await one("SELECT 1 FROM xp_events WHERE user_id = ? AND reason = 'quest' AND day = ?", [u.id, today]))

  const base = a.xp + XP_LESSON
  const flawlessBonus = a.mist === 0 ? XP_FLAWLESS : 0
  const questBonus = !questDone && lessonsToday >= QUEST_GOAL ? XP_QUEST : 0
  const projectBonus = isProject && firstTime ? XP_PROJECT : 0
  // Двойной XP из магазина удваивает всё, что заработано за урок
  const boostBonus = (u.double_xp_until ?? 0) > now ? base + flawlessBonus + questBonus + projectBonus : 0
  const earned = base + flawlessBonus + questBonus + projectBonus + boostBonus

  let streak = u.streak
  if (u.last_day !== today) streak = u.last_day === shiftDay(today, -1) ? u.streak + 1 : 1

  const xpRow = (amount: number, reason: string): InStatement => ({
    sql: 'INSERT INTO xp_events (user_id, amount, reason, node_id, day, week, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [u.id, amount, reason, a.node_id, today, week, now],
  })
  const stmts: InStatement[] = [
    {
      sql: 'INSERT INTO runs (user_id, node_id, unit_id, kind, got, mist, xp, time_ms, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [u.id, a.node_id, f.unit.id, lesson.kind, a.got, a.mist, earned, now - a.started_at, today, now],
    },
    xpRow(base, 'lesson'),
    { sql: 'UPDATE users SET streak = ?, max_streak = MAX(max_streak, ?), last_day = ? WHERE id = ?', args: [streak, streak, today, u.id] },
    { sql: 'DELETE FROM active_lessons WHERE user_id = ?', args: [u.id] },
  ]
  if (flawlessBonus) stmts.push(xpRow(flawlessBonus, 'flawless'))
  if (questBonus) stmts.push(xpRow(questBonus, 'quest'))
  if (projectBonus) stmts.push(xpRow(projectBonus, 'project'))
  if (boostBonus) stmts.push(xpRow(boostBonus, 'boost'))
  // Промпт из финальной песочницы проекта — по нему AI соберёт артефакт. Повторное прохождение пересобирает проект.
  if (isProject && a.sb_prompt) {
    stmts.push({
      sql: `INSERT INTO projects (id, user_id, unit_id, kind, prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, unit_id) DO UPDATE SET prompt = excluded.prompt, output = NULL, model = NULL, updated_at = excluded.updated_at`,
      args: [crypto.randomBytes(9).toString('base64url'), u.id, f.unit.id, f.unit.project.artifact, a.sb_prompt, now, now],
    })
  }
  await db().batch(stmts, 'write')

  return {
    result: {
      nodeId: a.node_id,
      unitId: f.unit.id,
      track: f.track,
      isProject,
      earned,
      flawlessBonus,
      questBonus,
      projectBonus,
      boostBonus,
      accuracy: Math.round((a.got / Math.max(1, a.got + a.mist)) * 100),
      timeMs: now - a.started_at,
      streak,
    },
  }
}

export async function quit(u: UserRow) {
  await run('DELETE FROM active_lessons WHERE user_id = ?', [u.id])
}

/** «Повторить урок»: перезапускает урок с начала, но не восстанавливает сердечки — нужно дождаться таймера */
export async function retry(u: UserRow) {
  const a = await one<ActiveRow>('SELECT * FROM active_lessons WHERE user_id = ?', [u.id])
  if (!a) throw new HttpError(409, 'Нет активного урока', 'no-lesson')
  await syncHearts(u)
  if (u.hearts <= 0) throw new HttpError(409, 'Сердечки закончились — подожди восстановления по таймеру', 'no-hearts')
  await run('INSERT OR REPLACE INTO active_lessons (user_id, node_id, started_at) VALUES (?, ?, ?)', [u.id, a.node_id, Date.now()])
}

/* ---------- Лига ---------- */

export async function league(u: UserRow) {
  const today = dayKey(u.tz)
  const rows = await all<{ id: string; name: string; xp: number }>(
    `SELECT u.id, u.name, COALESCE(SUM(e.amount), 0) AS xp
     FROM users u LEFT JOIN xp_events e ON e.user_id = u.id AND e.week = ?
     GROUP BY u.id ORDER BY xp DESC, u.created_at ASC`,
    [weekKey(today)],
  )
  return {
    daysLeft: 7 - weekday(today),
    total: rows.length,
    rows: rows.slice(0, 50).map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, xp: Number(r.xp), me: r.id === u.id })),
    me: rows.findIndex((r) => r.id === u.id) + 1,
  }
}

/* ---------- Проекты ---------- */

interface ProjectRow {
  id: string
  user_id: string
  unit_id: string
  kind: 'html' | 'code' | 'text'
  prompt: string
  output: string | null
  model: string | null
  updated_at: number
}

const projectView = (p: ProjectRow) => ({
  id: p.id,
  unitId: p.unit_id,
  kind: p.kind,
  prompt: p.prompt,
  output: p.output,
  model: p.model,
  updatedAt: p.updated_at,
})

export async function getProject(u: UserRow, unitId: string) {
  const p = await one<ProjectRow>('SELECT * FROM projects WHERE user_id = ? AND unit_id = ?', [u.id, unitId])
  if (!p) throw new HttpError(404, 'Проект ещё не создан', 'no-project')
  return projectView(p)
}

const building = new Set<string>()

/** AI выполняет промпт юзера и сохраняет результат */
export async function buildProject(u: UserRow, unitId: string, force: boolean) {
  const p = await one<ProjectRow>('SELECT * FROM projects WHERE user_id = ? AND unit_id = ?', [u.id, unitId])
  if (!p) throw new HttpError(404, 'Проект ещё не создан', 'no-project')
  if (p.output && !force) return projectView(p)
  if (building.has(p.id)) throw new HttpError(409, 'Проект уже собирается', 'building')
  aiRateLimit(u.id)
  building.add(p.id)
  try {
    const { output, model } = await buildArtifact(p.kind, p.prompt)
    const now = Date.now()
    await run('UPDATE projects SET output = ?, model = ?, updated_at = ? WHERE id = ?', [output, model, now, p.id])
    return projectView({ ...p, output, model, updated_at: now })
  } finally {
    building.delete(p.id)
  }
}

export async function publicProject(id: string) {
  return one<ProjectRow & { author: string }>(
    'SELECT p.*, u.name AS author FROM projects p JOIN users u ON u.id = p.user_id WHERE p.id = ?',
    [id],
  )
}
