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
  /** Куда вернуть юзера после клика по ссылке из письма. Пусто — тот же хост, что принял запрос. */
  appUrl: (process.env.APP_URL ?? '').replace(/\/$/, ''),
  /** Администраторы задаются явно, чтобы обычные аккаунты не могли включить привилегии. */
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT) || 587,
    /** true на 587 — STARTTLS; на 465 соединение сразу шифрованное */
    tls: (process.env.SMTP_TLS ?? 'true') !== 'false',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'Vibely',
  },
}

if (!env.smtp.host || !env.smtp.user) console.warn('[vibely] SMTP не настроен — письма с кодами отправляться не будут')

if (!env.mistralKey) console.warn('[vibely] MISTRAL_API_KEY не задан — песочница и проекты будут отвечать 503')
