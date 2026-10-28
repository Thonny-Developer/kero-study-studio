# kero-study-studio

Vibely: фронт на Vite + React (`frontend/`), API на Express (`backend/`). Локальный запуск описан в README каждой папки.

## Деплой на Vercel

Один проект из корня репозитория: фронт отдаётся статикой, `/api/*` и `/p/*` обслуживает serverless-функция `api/index.ts` с Express-приложением. Сборка и роуты заданы в `vercel.json`, в настройках проекта ничего менять не нужно.

1. Создай базу в [Turso](https://turso.tech) (файловая SQLite на Vercel не работает):
   ```bash
   turso db create vibely
   turso db show vibely --url
   turso db tokens create vibely
   ```
   Таблицы создаются сами при первом запросе.
2. В Vercel: **Add New → Project**, импортируй репозиторий. Root Directory оставь пустым (корень).
3. Environment Variables:

   | Переменная | Обязательна | Значение |
   |---|---|---|
   | `DATABASE_URL` | да | `libsql://…turso.io` |
   | `DATABASE_AUTH_TOKEN` | да | токен Turso |
   | `MISTRAL_API_KEY` | да | без него песочница и проекты отвечают 503 |
   | `ADMIN_EMAILS` | нет | почты админов через запятую |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | для писем | см. `backend/.env.example` |
   | `MISTRAL_MODEL`, `MISTRAL_CODE_MODEL` | нет | по умолчанию `ministral-14b-latest` и `codestral-latest` |
   | `APP_URL` | нет | свой домен, если ссылки из писем должны вести на него; пусто — домен, принявший запрос |

   `CORS_ORIGIN` и `VITE_API_URL` не нужны: фронт и API на одном домене.
4. Deploy.

Проверка после деплоя: `https://<домен>/api/health` должен вернуть `{"ok":true,…}`.
