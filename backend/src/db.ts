import { createClient, type Client, type InArgs } from '@libsql/client'
import fs from 'node:fs'
import path from 'node:path'
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
]

let client: Client | null = null

export function db(): Client {
  if (client) return client
  if (env.databaseUrl.startsWith('file:')) {
    if (process.env.VERCEL) throw new Error('На Vercel нужна внешняя БД: задай DATABASE_URL (Turso) и DATABASE_AUTH_TOKEN')
    fs.mkdirSync(path.dirname(env.databaseUrl.slice(5)), { recursive: true })
  }
  client = createClient({ url: env.databaseUrl, authToken: env.databaseToken })
  return client
}

let migrated: Promise<void> | null = null

export function ready() {
  migrated ??= (async () => {
    const c = db()
    if (env.databaseUrl.startsWith('file:')) await c.execute('PRAGMA foreign_keys = ON')
    await c.batch(SCHEMA, 'write')
    const cols = new Set((await c.execute('PRAGMA table_info(users)')).rows.map((r) => String(r.name)))
    for (const [name, type] of USER_COLUMNS) if (!cols.has(name)) await c.execute(`ALTER TABLE users ADD COLUMN ${name} ${type}`)
    const activeCols = new Set((await c.execute('PRAGMA table_info(active_lessons)')).rows.map((r) => String(r.name)))
    if (!activeCols.has('queue')) await c.execute('ALTER TABLE active_lessons ADD COLUMN queue TEXT')
    await c.execute('CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email_key)')
  })()
  return migrated
}

export async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const rs = await db().execute({ sql, args })
  return rs.rows as unknown as T[]
}

export async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0]
}

export async function run(sql: string, args: InArgs = []) {
  return db().execute({ sql, args })
}
