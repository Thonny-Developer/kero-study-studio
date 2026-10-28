import { createClient } from '@libsql/client'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { env } from './env.js'

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL UNIQUE,
    pass TEXT NOT NULL,
    goal TEXT,
    level TEXT,
    mins INTEGER,
    track TEXT NOT NULL DEFAULT 'code',
    tz TEXT NOT NULL DEFAULT 'UTC',
    hearts INTEGER NOT NULL DEFAULT 5,
    hearts_at INTEGER,
    infinite_hearts INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    last_day TEXT,
    bugs INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`,
  // Каждое начисление XP — отдельная строка: из них считаются общий и недельный XP
  `CREATE TABLE IF NOT EXISTS xp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    node_id TEXT,
    day TEXT NOT NULL,
    week TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS xp_events_user ON xp_events(user_id)`,
  `CREATE INDEX IF NOT EXISTS xp_events_week ON xp_events(week)`,
  `CREATE INDEX IF NOT EXISTS xp_events_time ON xp_events(created_at)`,
  // Пройденные уроки, проекты и открытые сундуки
  `CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    got INTEGER NOT NULL DEFAULT 0,
    mist INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    time_ms INTEGER NOT NULL DEFAULT 0,
    day TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS runs_user ON runs(user_id)`,
  // Урок, который юзер проходит прямо сейчас (переживает перезагрузку страницы)
  `CREATE TABLE IF NOT EXISTS active_lessons (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    idx INTEGER NOT NULL DEFAULT 0,
    got INTEGER NOT NULL DEFAULT 0,
    mist INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    answer TEXT,
    sb_prompt TEXT,
    queue TEXT
  )`,
  // Артефакты, которые AI собрал по промпту юзера в проекте юнита
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    prompt TEXT NOT NULL,
    output TEXT,
    model TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, unit_id)
  )`,
  // Одноразовые коды из писем: подтверждение почты и сброс пароля
  `CREATE TABLE IF NOT EXISTS email_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    link_hash TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    used_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS email_codes_user ON email_codes(user_id, purpose)`,
  // Операции с монетами: обмен XP (amount > 0) и покупки в магазине (amount < 0)
  `CREATE TABLE IF NOT EXISTS coin_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    amount INTEGER NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    price REAL,
    item TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coin_events_user ON coin_events(user_id)`,
  `CREATE INDEX IF NOT EXISTS coin_events_time ON coin_events(created_at)`,
  // Заходы в приложение: одна строка на юзера в день (день — в его таймзоне), hits — число сессий
  `CREATE TABLE IF NOT EXISTS visits (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    hits INTEGER NOT NULL DEFAULT 1,
    first_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, day)
  )`,
  `CREATE INDEX IF NOT EXISTS visits_day ON visits(day)`,
]

// Колонки, добавленные после первого релиза: ALTER для уже существующих баз
const USER_COLUMNS: [string, string][] = [
  ['email', 'TEXT'],
  ['email_key', 'TEXT'],
  ['email_verified', 'INTEGER NOT NULL DEFAULT 0'],
  ['infinite_hearts', 'INTEGER NOT NULL DEFAULT 0'],
  ['coins', 'INTEGER NOT NULL DEFAULT 0'],
  ['xp_spent', 'INTEGER NOT NULL DEFAULT 0'],
  ['double_xp_until', 'INTEGER'],
  ['avatar_frame', 'TEXT'],
  ['name_color', 'TEXT'],
  ['blink_skin', 'TEXT'],
  ['pet_name', 'TEXT'],
  ['pet_hunger', 'INTEGER NOT NULL DEFAULT 80'],
  ['pet_thirst', 'INTEGER NOT NULL DEFAULT 80'],
  ['pet_happiness', 'INTEGER NOT NULL DEFAULT 85'],
  ['pet_xp', 'INTEGER NOT NULL DEFAULT 0'],
  ['pet_updated_at', 'INTEGER'],
  ['pet_decor', 'TEXT'],
]

export type Arg = string | number | bigint | null
export interface Stmt {
  sql: string
  args?: Arg[]
}
export interface Result {
  rows: Record<string, unknown>[]
  rowsAffected: number
}
/** Общий интерфейс поверх SQLite (libsql, локально) и Postgres (Supabase, прод) */
interface Db {
  execute(s: Stmt): Promise<Result>
  /** Все запросы одной транзакцией */
  batch(stmts: (Stmt | string)[], mode?: 'write'): Promise<Result[]>
}

export const isPostgres = /^postgres(ql)?:\/\//.test(env.databaseUrl)

/** ? -> $1, $2… (вопросы внутри строковых литералов не трогаем) */
function numbered(sql: string) {
  let n = 0
  let quoted = false
  let out = ''
  for (const ch of sql) {
    if (ch === "'") quoted = !quoted
    out += ch === '?' && !quoted ? `$${++n}` : ch
  }
  return out
}

/** Схема пишется под SQLite; в Postgres время в мс не влезает в INTEGER, а REAL — 4-байтовый */
const pgSchema = (sql: string) =>
  sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY')
    .replace(/\bINTEGER\b/g, 'BIGINT')
    .replace(/\bREAL\b/g, 'DOUBLE PRECISION')

function postgres(): Db {
  // BIGINT, COUNT и SUM приходят строками — приводим к числам, как в SQLite
  pg.types.setTypeParser(20, Number)
  pg.types.setTypeParser(1700, Number)
  const url = new URL(env.databaseUrl)
  url.searchParams.delete('sslmode')
  const local = ['localhost', '127.0.0.1'].includes(url.hostname)
  // в serverless каждая копия функции держит свой пул, поэтому он маленький
  const pool = new pg.Pool({ connectionString: url.toString(), max: 3, ssl: local ? false : { rejectUnauthorized: false } })
  const exec = async (q: pg.Pool | pg.PoolClient, s: Stmt | string): Promise<Result> => {
    const st = typeof s === 'string' ? { sql: s } : s
    const r = await q.query(numbered(st.sql), (st.args ?? []) as unknown[])
    return { rows: r.rows, rowsAffected: r.rowCount ?? 0 }
  }
  return {
    execute: (s) => exec(pool, s),
    async batch(stmts) {
      const c = await pool.connect()
      try {
        await c.query('BEGIN')
        const out: Result[] = []
        for (const s of stmts) out.push(await exec(c, s))
        await c.query('COMMIT')
        return out
      } catch (e) {
        await c.query('ROLLBACK').catch(() => {})
        throw e
      } finally {
        c.release()
      }
    },
  }
}

function sqlite(): Db {
  if (process.env.VERCEL) throw new Error('На Vercel нужна внешняя БД: задай DATABASE_URL (Postgres, например Supabase)')
  if (env.databaseUrl.startsWith('file:')) fs.mkdirSync(path.dirname(env.databaseUrl.slice(5)), { recursive: true })
  const c = createClient({ url: env.databaseUrl, authToken: env.databaseToken })
  const wrap = (r: { rows: unknown[]; rowsAffected: number }): Result => ({ rows: r.rows as Result['rows'], rowsAffected: r.rowsAffected })
  return {
    execute: async (s) => wrap(await c.execute({ sql: s.sql, args: s.args ?? [] })),
    batch: async (stmts) => (await c.batch(stmts.map((s) => (typeof s === 'string' ? s : { sql: s.sql, args: s.args ?? [] })), 'write')).map(wrap),
  }
}

let client: Db | null = null

export function db(): Db {
  client ??= isPostgres ? postgres() : sqlite()
  return client
}

let migrated: Promise<void> | null = null

export function ready() {
  migrated ??= (async () => {
    const c = db()
    if (isPostgres) {
      await c.batch(SCHEMA.map(pgSchema))
      await c.batch([
        ...USER_COLUMNS.map(([name, type]) => pgSchema(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${name} ${type}`)),
        'ALTER TABLE active_lessons ADD COLUMN IF NOT EXISTS queue TEXT',
        'CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email_key)',
      ])
      return
    }
    if (env.databaseUrl.startsWith('file:')) await c.execute({ sql: 'PRAGMA foreign_keys = ON' })
    await c.batch(SCHEMA)
    const cols = new Set((await c.execute({ sql: 'PRAGMA table_info(users)' })).rows.map((r) => String(r.name)))
    for (const [name, type] of USER_COLUMNS) if (!cols.has(name)) await c.execute({ sql: `ALTER TABLE users ADD COLUMN ${name} ${type}` })
    const activeCols = new Set((await c.execute({ sql: 'PRAGMA table_info(active_lessons)' })).rows.map((r) => String(r.name)))
    if (!activeCols.has('queue')) await c.execute({ sql: 'ALTER TABLE active_lessons ADD COLUMN queue TEXT' })
    await c.execute({ sql: 'CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email_key)' })
  })()
  // упавшую миграцию (например, БД недоступна) повторим на следующем запросе
  migrated.catch(() => (migrated = null))
  return migrated
}

export async function all<T>(sql: string, args: Arg[] = []): Promise<T[]> {
  return (await db().execute({ sql, args })).rows as T[]
}

export async function one<T>(sql: string, args: Arg[] = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0]
}

export async function run(sql: string, args: Arg[] = []) {
  return db().execute({ sql, args })
}
