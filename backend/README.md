# Vibely API

Бэкенд Vibely на Express и TypeScript. Он хранит аккаунты и весь игровой прогресс, сам проверяет ответы, а через Mistral AI оценивает промпты и собирает проекты юнитов.

Сервер — единственный источник правды. Клиент получает задания без правильных ответов и не может сам начислить себе XP или сердечки.

## Запуск

```bash
cd backend
npm install
cp .env.example .env   # вставь MISTRAL_API_KEY
npm run dev            # http://localhost:8787, перезапуск при изменениях
```

Фронт (`../frontend`, `npm run dev`) проксирует `/api` и `/p` на этот порт.

| Команда | Что делает |
|---|---|
| `npm run dev` | сервер с hot-reload (tsx watch) |
| `npm start` | сервер без watch |
| `npm run models` | какие модели Mistral реально отвечают по твоему ключу |
| `npm run typecheck` | проверка типов |

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `MISTRAL_API_KEY` | ключ Mistral, обязателен для песочницы и проектов. Без него эти эндпоинты отвечают 503, остальное работает |
| `MISTRAL_MODEL` | оценка промптов и текстовые проекты. По умолчанию `ministral-14b-latest` |
| `MISTRAL_CODE_MODEL` | HTML и код в проектах. По умолчанию `codestral-latest` |
| `DATABASE_URL` | `file:./data/vibely.db` локально или `libsql://….turso.io` в проде |
| `DATABASE_AUTH_TOKEN` | токен Turso |
| `CORS_ORIGIN` | адрес фронта, например `https://vibely.vercel.app`. Если пусто — запросы разрешены с любого origin |
| `PORT` | порт, по умолчанию 8787 |

### Какие модели выбраны и почему

`npm run models` по очереди пробует каждую чат-модель коротким запросом. Почти у половины моделей из списка `/v1/models` квота на этом ключе равна нулю (ответ `429`, `x-ratelimit-limit-req-minute: 0`). Это относится к `mistral-medium*`, `mistral-small*` и `magistral-*`. Из тех, что реально отвечают, самые сильные:

- `ministral-14b-latest` — оценка промптов (JSON по схеме, ~4 с) и тексты для маркетинговых проектов;
- `codestral-latest` — лендинг и код бота (~12 с на лендинг).

Если на тарифе откроется `mistral-medium-latest`, достаточно поменять `MISTRAL_MODEL` в `.env`.

## Данные

Хранятся в SQLite через libSQL. Локально это файл `data/vibely.db`, в проде база в Turso, код один и тот же. Таблицы создаются при старте.

- `users`: профиль, сердечки, стрик, таймзона;
- `sessions`: хэши токенов (сам токен в БД не хранится);
- `xp_events`: каждое начисление XP с днём и неделей; из них считаются общий XP, недельный XP и лига;
- `runs`: пройденные уроки, проекты и сундуки (из них берутся «пройдено», календарь и статистика юнита);
- `active_lessons`: текущий урок, поэтому перезагрузка страницы ничего не ломает;
- `projects`: промпт юзера из финальной песочницы юнита и то, что AI по нему собрал.

Дни и недели считаются в таймзоне пользователя (заголовок `X-Timezone`), поэтому стрик не рвётся на границе суток по UTC.

## API

Авторизация: `Authorization: Bearer <token>`. Ошибки приходят в формате `{ error, code }`.

| Метод | Путь | Что делает |
|---|---|---|
| POST | `/api/auth/register` | `{ name, password, goal?, level?, mins? }` → `{ token }` |
| POST | `/api/auth/login` | `{ name, password }` → `{ token }` |
| POST | `/api/auth/logout` | удаляет сессию |
| GET | `/api/course` | структура курса без заданий |
| GET | `/api/me` | всё состояние юзера: XP, сердечки, стрик, дни, пройденное, текущий урок |
| PATCH | `/api/me` | `{ name?, track? }` |
| POST | `/api/nodes/:id/open` | открыть узел: урок, сундук или готовый проект; закрытые узлы сервер не пускает |
| POST | `/api/lesson/answer` | `{ sel }` или `{ chosen }`: проверка, сердечко, XP |
| POST | `/api/lesson/sandbox` | `{ prompt }`: оценка Mistral 0–100, фидбек и улучшенный промпт |
| POST | `/api/lesson/next` | следующее задание или итог урока (XP, бонусы, стрик, квест) |
| POST | `/api/lesson/quit` | выйти из урока |
| POST | `/api/lesson/retry` | при 0 сердечек: урок заново с полным запасом |
| GET | `/api/league` | реальные юзеры, места по XP за текущую неделю |
| GET | `/api/projects/:unitId` | проект юнита |
| POST | `/api/projects/:unitId/build` | AI выполняет промпт юзера (`{ force: true }` пересобирает) |
| GET | `/p/:id` | публичная страница проекта |
| GET | `/api/health` | `{ ok, ai, model }` |

Сгенерированный HTML отдаётся на `/p/:id` с `Content-Security-Policy: sandbox`, поэтому у такой страницы нет доступа к origin приложения. Вызовы AI ограничены 8 в минуту на юзера. Если Mistral не ответил, клиент получает понятную ошибку и может повторить. Подставных оценок нет.

## Деплой

### Vercel + Turso

1. Создай базу в [Turso](https://turso.tech):
   ```bash
   turso db create vibely
   turso db show vibely --url
   turso db tokens create vibely
   ```
2. В Vercel: **Add New → Project**, тот же репозиторий, **Root Directory** = `backend`, Framework Preset — **Other**.
3. Добавь Environment Variables: `MISTRAL_API_KEY`, `MISTRAL_MODEL`, `MISTRAL_CODE_MODEL`, `DATABASE_URL` (libsql://…), `DATABASE_AUTH_TOKEN`, `CORS_ORIGIN` (адрес фронта).
4. Нажми Deploy. `api/index.ts` экспортирует Express-приложение, а `vercel.json` направляет все пути в эту функцию (лимит 60 с — хватает на сборку лендинга).

На Vercel файловую SQLite использовать нельзя: при `file:` URL сервер сразу сообщит об этом при старте.

### Render, Railway или VPS

Build command: `npm install`. Start command: `npm start`. Можно оставить SQLite в файле, если подключить постоянный диск и указать `DATABASE_URL=file:/data/vibely.db`. Либо подключить ту же Turso.
