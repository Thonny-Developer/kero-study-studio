# kero-study-studio

Vibely: фронт на Vite + React (`frontend/`), API на Express (`backend/`). Локальный запуск описан в README каждой папки.

## Деплой на Vercel

Один проект из корня репозитория: фронт отдаётся статикой, `/api/*` и `/p/*` обслуживает serverless-функция `api/index.ts` с Express-приложением. Сборка и роуты заданы в `vercel.json`, в настройках проекта ничего менять не нужно.

1. База — Postgres в [Supabase](https://supabase.com) (файловая SQLite на Vercel не работает). В проекте Supabase: **Connect → Connection string → Transaction pooler** (порт 6543), подставь пароль БД вместо `[YOUR-PASSWORD]`. Direct connection (`db.<ref>.supabase.co:5432`) работает только по IPv6, с Vercel до неё не достучаться.
   Таблицы создаются сами при первом запросе.
2. В Vercel: **Add New → Project**, импортируй репозиторий. Root Directory оставь пустым (корень).
3. Environment Variables:

   | Переменная | Обязательна | Значение |
   |---|---|---|
   | `DATABASE_URL` | да | `postgresql://postgres.<ref>:<пароль>@aws-0-<регион>.pooler.supabase.com:6543/postgres` |
   | `MISTRAL_API_KEY` | да | без него песочница и проекты отвечают 503 |
   | `ADMIN_EMAILS` | нет | почты админов через запятую |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | для писем | см. `backend/.env.example` |
   | `MISTRAL_MODEL`, `MISTRAL_CODE_MODEL` | нет | по умолчанию `ministral-14b-latest` и `codestral-latest` |
   | `APP_URL` | нет | свой домен, если ссылки из писем должны вести на него; пусто — домен, принявший запрос |

   `CORS_ORIGIN` и `VITE_API_URL` не нужны: фронт и API на одном домене.
4. Deploy.

Проверка после деплоя: `https://<домен>/api/health` должен вернуть `{"ok":true,…}`.
