# CREATUR / creator-platform

<p align="center">
  <img src="frontend/assets/logo.svg" alt="CREATUR" width="260" />
</p>

CREATUR — платформа для публикации и просмотра творческих проектов: 3D, дизайн, game art, digital art, кодовые прототипы, motion и смежные направления.

Проект начинался как статический frontend-MVP по Figma-концепту. Сейчас он постепенно переводится в полноценное full-stack приложение: frontend остаётся рабочим визуальным прототипом, а backend строится под ним так, чтобы позже заменить mock-данные настоящими API-запросами.

## Содержание

- [Текущее состояние](#текущее-состояние)
- [Визуальный обзор](#визуальный-обзор)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Frontend](#frontend)
- [Backend](#backend)
- [Почему выбран такой стек](#почему-выбран-такой-стек)
- [Запуск без Docker](#запуск-без-docker)
- [Запуск с PostgreSQL](#запуск-с-postgresql)
- [Переменные окружения](#переменные-окружения)
- [API](#api)
- [Модель данных](#модель-данных)
- [Что игнорируется Git](#что-игнорируется-git)
- [Политика разработки](#политика-разработки)
- [Проверки](#проверки)
- [Следующие шаги](#следующие-шаги)

## Текущее состояние

Сейчас репозиторий уже переведён в monorepo-структуру:

```text
frontend/  Статический MVP интерфейса
backend/   TypeScript API scaffold
docs/      План backend и исходные дизайн-экраны
```

Такой формат выбран осознанно: проект ещё на раннем этапе, и frontend с backend удобнее развивать рядом. Когда API меняется, сразу видно, какие места frontend нужно будет адаптировать.

Уже сделано:

- перенесён текущий статический сайт в `frontend/`;
- добавлен backend на Express + TypeScript;
- добавлена Prisma-модель данных;
- добавлен локальный SQLite-режим без Docker;
- сохранена PostgreSQL-схема для будущего production-like режима;
- добавлена регистрация, логин, logout, session check;
- добавлены password reset endpoints;
- добавлена email-заглушка через Nodemailer JSON transport;
- добавлены роли `ADMIN` и `USER`;
- добавлены проекты, категории, файлы, лайки, просмотры;
- добавлена загрузка нескольких файлов;
- добавлены admin endpoints для модерации;
- README теперь ведётся как основная входная документация.

## Визуальный обзор

Ниже — исходные экраны из Figma/export, которые лежат в репозитории и служат визуальной базой для текущего frontend.

| Экран | Превью |
| --- | --- |
| Главная до регистрации | ![Главная до регистрации](docs/design/home-before-registration.svg) |
| Главная после регистрации | ![Главная после регистрации](docs/design/home-after-registration.svg) |
| Логин | ![Логин](docs/design/login.svg) |
| Регистрация | ![Регистрация](docs/design/register.svg) |
| Профиль пользователя | ![Профиль пользователя](docs/design/user-profile.svg) |
| Загрузка проекта | ![Загрузка проекта](docs/design/project-upload-empty.svg) |
| Проект другого автора | ![Проект другого автора](docs/design/project-public-foreign.svg) |

## Архитектура

На текущем этапе frontend и backend можно запускать отдельно. Frontend пока работает как статический интерфейс, а backend уже отдаёт реальные API endpoints.

```mermaid
flowchart LR
  user["Пользователь в браузере"]
  frontend["frontend<br/>HTML + CSS + JS"]
  api["backend<br/>Express + TypeScript"]
  prisma["Prisma Client"]
  sqlite["SQLite dev.db<br/>локальная разработка"]
  postgres["PostgreSQL<br/>будущий production-like режим"]
  files["uploads/<br/>локальные файлы"]
  mail["Nodemailer<br/>SMTP или JSON transport"]

  user --> frontend
  frontend -->|"будущие /api запросы"| api
  api --> prisma
  prisma --> sqlite
  prisma -. "позже" .-> postgres
  api --> files
  api --> mail
```

Главная идея: сейчас мы не ломаем frontend ради backend. Сначала стабилизируем API, данные, auth, upload и статусы проектов. Потом frontend начнёт читать эти данные из backend.

## Структура репозитория

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          PostgreSQL Prisma schema
│   │   ├── schema.sqlite.prisma   SQLite Prisma schema для разработки без Docker
│   │   ├── init-sqlite.mjs        Создание локальной SQLite dev.db
│   │   └── seed.ts                Наполнение фиксированными категориями
│   ├── src/
│   │   ├── lib/                   Общие backend helper'ы
│   │   ├── routes/                API route-модули
│   │   ├── app.ts                 Сборка Express-приложения
│   │   ├── config.ts              Конфиг из переменных окружения
│   │   └── server.ts              Точка входа API
│   ├── .env.example               Пример переменных окружения
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── assets/                    Лого, favicon, изображения из Figma
│   ├── tools/static-server.js     Простой локальный static server
│   ├── app.js                     Поведение статического frontend
│   ├── index.html
│   └── styles.css
├── docs/
│   ├── backend-plan.md            Решения по backend и API draft
│   └── design/                    SVG-экраны из Figma
├── docker-compose.yml             Опциональный PostgreSQL
└── README.md
```

## Frontend

Frontend сейчас остаётся статическим MVP. Мы специально не доводим его до финальной полировки, пока backend не задаст реальные данные, состояния загрузки, ошибки, права доступа и форматы API.

Текущий frontend включает:

- главную страницу до и после авторизации;
- каталог проектов;
- фильтры каталога;
- поиск;
- модалки входа и регистрации;
- профиль автора;
- личный кабинет;
- экран загрузки проекта;
- страницу проекта;
- адаптивную верстку под desktop/mobile.

Запуск frontend:

```powershell
cd C:\repositories\gleb_request\frontend
node tools/static-server.js
```

Открыть:

```text
http://127.0.0.1:4173
```

`tools/static-server.js` сделан максимально простым и без зависимостей. Его задача — отдавать HTML/CSS/JS/SVG/PNG локально, чтобы frontend можно было смотреть в браузере одинаково стабильно.

## Backend

Backend — это Express + TypeScript API с Prisma в качестве слоя доступа к данным.

Что уже есть:

- `POST /api/auth/register` — регистрация по email/password;
- `POST /api/auth/login` — вход;
- `POST /api/auth/logout` — выход;
- `GET /api/auth/me` — проверка текущей cookie-сессии;
- `POST /api/auth/password-reset/request` — запрос письма для сброса пароля;
- `POST /api/auth/password-reset/confirm` — установка нового пароля по token;
- `GET /api/categories` — фиксированные категории и фильтры;
- `GET /api/projects` — список опубликованных проектов;
- `POST /api/projects` — создание проекта;
- `POST /api/projects/:id/files` — загрузка нескольких файлов;
- `POST /api/projects/:id/like` — лайк;
- `DELETE /api/projects/:id/like` — убрать лайк;
- admin endpoints для публикации/отклонения проектов и просмотра пользователей.

## Почему выбран такой стек

### Node.js

Frontend уже написан на JavaScript, поэтому backend на Node.js позволяет держать проект в одной языковой экосистеме. Это ускоряет разработку и снижает переключение контекста.

### Express

Express выбран потому, что backend пока небольшой. Нам важнее быстро и прозрачно видеть routes, middleware, cookies, validation и ошибки, чем сразу вводить более тяжёлый framework.

### TypeScript

TypeScript нужен, чтобы backend не превращался в набор неявных объектов. Он помогает держать под контролем:

- форму session payload;
- route input/output;
- Prisma-модели;
- роли пользователей;
- будущие API-контракты для frontend.

### Prisma

Prisma выбран как typed ORM/schema layer. Он даёт:

- явную схему данных;
- typed client;
- миграции для PostgreSQL;
- возможность работать с SQLite в local dev;
- более мягкий переход от прототипа к production-like базе.

### SQLite

SQLite добавлен как рабочий режим без Docker. На текущей машине Docker Desktop не запускается из-за отсутствия virtualization support, поэтому SQLite позволяет продолжать backend-разработку прямо сейчас.

Это временный dev-режим, но полезный: любой другой ПК сможет поднять проект без установки PostgreSQL, если нужен быстрый локальный старт.

### PostgreSQL

PostgreSQL остаётся целевой базой для production-like окружения. Для него уже есть:

- `backend/prisma/schema.prisma`;
- `docker-compose.yml`;
- scripts в `package.json`.

### Nodemailer

Nodemailer нужен, потому что продуктово уже требуется отправка писем:

- после регистрации;
- для сброса пароля.

Если `SMTP_URL` пустой, используется JSON transport. Это значит, что локально backend создаёт email payload, но не отправляет реальные письма.

### Zod

Zod используется для validation на входе routes. Так API сразу отсекает неправильные payload'ы и возвращает понятные `400` вместо случайных runtime-ошибок глубже в коде.

### Multer

Multer используется для `multipart/form-data` upload. Нам нужна поддержка нескольких файлов и разных форматов: изображения, видео, 3D-модели, архивы, документы.

## Запуск без Docker

Это основной текущий режим разработки.

Установить зависимости:

```powershell
cd C:\repositories\gleb_request\backend
npm install
```

Создать локальную SQLite-базу и Prisma Client:

```powershell
npm run prisma:push:sqlite
```

Заполнить фиксированные категории:

```powershell
npm run prisma:seed
```

Запустить API:

```powershell
npm run dev
```

Проверить API:

```text
http://127.0.0.1:3000/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

Проверить категории:

```text
http://127.0.0.1:3000/api/categories
```

## Запуск с PostgreSQL

Этот режим нужен позже, когда Docker Desktop или нативный PostgreSQL будут доступны.

Запустить PostgreSQL через Docker:

```powershell
cd C:\repositories\gleb_request
docker compose up -d postgres
```

Подготовить backend:

```powershell
cd C:\repositories\gleb_request\backend
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

API:

```text
http://127.0.0.1:3000
```

## Переменные окружения

`backend/.env.example` коммитится, потому что показывает нужные настройки.

`backend/.env` не коммитится, потому что в нём могут быть секреты, SMTP-доступы, локальные пути и machine-specific настройки.

Пример:

```env
DATABASE_URL="postgresql://creatur:creatur@localhost:5432/creatur?schema=public"
SQLITE_DATABASE_URL="file:./dev.db"
PORT=3000
FRONTEND_ORIGIN="http://127.0.0.1:4173"
JWT_SECRET="replace-with-a-long-random-secret"
SMTP_URL=""
MAIL_FROM="CREATUR <noreply@creatur.local>"
UPLOAD_DIR="uploads"
```

## API

### Auth Flow

```mermaid
sequenceDiagram
  participant Browser as Browser
  participant API as Express API
  participant DB as Prisma Database
  participant Mail as Nodemailer

  Browser->>API: POST /api/auth/register
  API->>API: Validate body with Zod
  API->>API: Hash password with bcrypt
  API->>DB: Create user
  API->>Mail: Send registration email
  API-->>Browser: Set httpOnly session cookie

  Browser->>API: GET /api/auth/me
  API->>API: Verify JWT from cookie
  API->>DB: Load user
  API-->>Browser: Public user profile
```

### Password Reset Flow

```mermaid
sequenceDiagram
  participant User as User
  participant API as Express API
  participant DB as Prisma Database
  participant Mail as Nodemailer

  User->>API: POST /api/auth/password-reset/request
  API->>DB: Find user by email
  API->>API: Generate raw token
  API->>API: Store only token hash
  API->>Mail: Send reset link
  API-->>User: 204

  User->>API: POST /api/auth/password-reset/confirm
  API->>API: Hash received token
  API->>DB: Find valid unused token
  API->>DB: Update passwordHash and mark token used
  API-->>User: 204
```

### Upload Flow

```mermaid
flowchart TD
  browser["Browser upload form"]
  route["POST /api/projects/:id/files"]
  auth["requireAuth middleware"]
  owner["Check owner or ADMIN"]
  multer["Multer saves files locally"]
  classify["Classify file kind"]
  db["Create ProjectFile records"]
  response["Return uploaded file records"]

  browser --> route
  route --> auth
  auth --> owner
  owner --> multer
  multer --> classify
  classify --> db
  db --> response
```

## Модель данных

```mermaid
erDiagram
  User ||--o{ Project : owns
  User ||--o{ ProjectFile : uploads
  User ||--o{ Like : likes
  User ||--o{ ProjectView : views
  User ||--o{ PasswordResetToken : resets

  Project ||--o{ ProjectFile : has
  Project ||--o{ ProjectCategory : tagged_with
  Project ||--o{ Like : receives
  Project ||--o{ ProjectView : receives

  Category ||--o{ ProjectCategory : used_by

  User {
    string id
    string email
    string passwordHash
    string displayName
    string role
  }

  Project {
    string id
    string ownerId
    string title
    string description
    string status
  }

  ProjectFile {
    string id
    string projectId
    string storageKey
    string mimeType
    string kind
  }

  Category {
    string id
    string slug
    string name
    string group
  }
```

## Что игнорируется Git

В Git не должны попадать локальные, сгенерированные и потенциально чувствительные файлы:

- `node_modules/` — зависимости восстанавливаются через `npm install`;
- `dist/` — результат сборки `npm run build`;
- `.env` — может содержать секреты;
- `uploads/` — локальные загруженные файлы;
- `*.db` — локальные SQLite-базы;
- `*.log` — runtime/debug logs.

## Политика разработки

Код должен быть хорошо прокомментирован там, где важно понимать причину решения, а не только действие.

Комментируем обязательно:

- auth/security decisions;
- работу с cookie/JWT;
- password reset и хранение token hash;
- различия SQLite/PostgreSQL;
- upload limits;
- временные dev-обходы;
- места, которые позже должны быть заменены production-реализацией.

Не нужно комментировать очевидные строки вроде “создаём переменную” или “возвращаем ответ”. Комментарий должен объяснять смысл и причину, иначе он быстро станет шумом.

README должен обновляться после каждого значимого шага. В нём нужно фиксировать:

- что изменилось;
- как это запустить;
- зачем выбран такой подход;
- что является временным;
- что проверить;
- какой следующий шаг.

## Проверки

Во время backend setup были успешно выполнены:

```powershell
npm run build
npm audit --audit-level=high
```

SQLite backend был проверен вручную:

- `/health` вернул `200`;
- `/api/categories` вернул `200`;
- регистрация вернула `201`;
- `/api/auth/me` вернул `200`;
- логин вернул `200`;
- password reset request вернул `204`.

## Следующие шаги

Рекомендуемый порядок:

1. Добавить frontend-friendly DTO для проектов и категорий.
2. Добавить seed проектов, чтобы каталог получал реальные данные из API.
3. Подключить frontend-фильтры к `/api/categories`.
4. Подключить frontend-каталог к `/api/projects`.
5. Подключить upload UI к `POST /api/projects/:id/files`.
6. Добавить базовый admin/moderation flow для проектов в статусе `PENDING`.
