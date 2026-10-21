import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 8787,
  mistralKey: process.env.MISTRAL_API_KEY ?? '',
  /** оценка промптов и тексты */
  mistralModel: process.env.MISTRAL_MODEL || 'ministral-14b-latest',
  /** генерация HTML и кода в проектах */
  mistralCodeModel: process.env.MISTRAL_CODE_MODEL || 'codestral-latest',
  /** file:./data/vibely.db локально, libsql://…turso.io в проде */
  databaseUrl: process.env.DATABASE_URL || 'file:./data/vibely.db',
  databaseToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  /** Откуда разрешены запросы фронта, через запятую. Пусто — любой origin (удобно в dev). */
  corsOrigins: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

if (!env.mistralKey) console.warn('[vibely] MISTRAL_API_KEY не задан — песочница и проекты будут отвечать 503')
