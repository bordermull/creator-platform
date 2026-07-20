# CREATUR / creator-platform

<p align="center">
  <img src="frontend/assets/logo.svg" alt="CREATUR" width="260" />
</p>

CREATUR — платформа для публикации и просмотра творческих проектов: 3D, дизайн, game art, digital art, кодовые прототипы, motion и смежные направления.

Проект начинался как статический frontend-MVP по Figma-концепту. Сейчас он переводится в полноценное full-stack приложение: frontend всё ещё сохраняет быстрый fallback на mock-данные, но ключевые сценарии уже подключаются к настоящему backend API.

## Содержание

- [Текущее состояние](#текущее-состояние)
- [Визуальный обзор](#визуальный-обзор)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Frontend](#frontend)
- [Backend](#backend)
- [Почему выбран такой стек](#почему-выбран-такой-стек)
- [Запуск с PostgreSQL](#запуск-с-postgresql)
- [Быстрый запуск без PostgreSQL SQLite](#быстрый-запуск-без-postgresql-sqlite)
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
- добавлен основной PostgreSQL-режим разработки;
- сохранён локальный SQLite-режим как быстрый fallback без PostgreSQL;
- добавлена регистрация, логин, logout, session check;
- добавлены password reset endpoints;
- добавлена email-заглушка через Nodemailer JSON transport;
- добавлены роли `ADMIN` и `USER`;
- добавлены проекты, категории, файлы, лайки, просмотры;
- добавлены демо-авторы и демо-проекты для живого `/api/projects`;
- добавлен DTO-слой для безопасных frontend-friendly project responses;
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
  postgres["PostgreSQL<br/>основная dev-база"]
  sqlite["SQLite dev.db<br/>быстрый fallback"]
  files["uploads/<br/>локальные файлы"]
  mail["Nodemailer<br/>SMTP или JSON transport"]

  user --> frontend
  frontend -->|"/api auth, catalog, upload, likes"| api
  api --> prisma
  prisma --> postgres
  prisma -. "fallback без PostgreSQL" .-> sqlite
  api --> files
  api --> mail
```

Главная идея: мы не ломаем текущий frontend ради backend. Вместо полной переписки интерфейса добавлен bridge-слой в `frontend/app.js`: он переводит backend DTO в старый UI-формат и позволяет постепенно заменять mock-сценарии реальными API-вызовами.

## Структура репозитория

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          основная PostgreSQL Prisma schema
│   │   ├── schema.sqlite.prisma   SQLite fallback schema для быстрого запуска
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

Frontend сейчас остаётся статическим MVP по способу запуска, но уже не является полностью “нарисованным” макетом. Каталог, поиск, фильтры, detail page, регистрация, вход, выход, загрузка проекта и лайки уже умеют обращаться к backend.

Текущий frontend включает:

- главную страницу до и после авторизации;
- каталог проектов;
- фильтры каталога;
- поиск;
- модалки входа и регистрации;
- admin moderation page;
- профиль автора;
- личный кабинет;
- экран загрузки проекта;
- страницу проекта;
- адаптивную верстку под desktop/mobile.

Каталог уже подключён к backend в переходном режиме. При открытии главной страницы frontend пытается загрузить `GET http://127.0.0.1:3000/api/projects`. Если backend запущен, карточки берутся из API. Если backend выключен или API вернул ошибку, frontend продолжает показывать локальные mock-данные.

Страница проекта также подключена к backend: она открывается мгновенно из уже известных данных каталога/fallback, а затем обновляется через `GET /api/projects/:id`. Опубликованные проекты доступны всем, а `DRAFT`, `PENDING` и `REJECTED` доступны только владельцу и администратору.

Auth тоже подключён к backend. При старте frontend делает `GET /api/auth/me` с cookie-сессией и только после этого решает, показывать ли личный кабинет и загрузку проекта. Это важнее, чем просто хранить флаг в `localStorage`: backend остаётся источником правды, а UI не считает пользователя авторизованным, если API-сессия уже недействительна.

Upload UI теперь создаёт настоящий проект:

1. пользователь выбирает один или несколько файлов через текущую drop zone;
2. frontend создаёт проект через `POST /api/projects`;
3. выбранные файлы отправляются через `POST /api/projects/:id/files`;
4. проект переводится из `DRAFT` в `PENDING` через `POST /api/projects/:id/submit`;
5. frontend открывает detail page созданного проекта, даже если он ещё не опубликован.

Редактирование проекта тоже уже подключено к backend. Автор может открыть `DRAFT` или `REJECTED` проект из личного кабинета или detail page, изменить название, описание и теги, удалить лишние файлы, добавить новые файлы и повторно отправить проект на модерацию. `PENDING` и `PUBLISHED` проекты намеренно заморожены: первый уже находится на проверке, второй уже виден публично и не должен меняться “за спиной” каталога.

Загруженные файлы больше не раздаются публично через `/uploads/...`. Для preview используется защищённый endpoint `GET /api/projects/:id/files/:fileId/preview`, который проверяет статус проекта и текущую cookie-сессию. Старые Figma/export ассеты остаются локальными `/assets/...`, потому что это не пользовательские upload-файлы и они нужны только для демо-визуала.

На странице проекта сейчас показываются:

- image preview для изображений;
- video preview через `<video controls>`;
- 3D-preview для `.glb` и `.gltf` через `<model-viewer>`;
- карточки для остальных 3D/model, archive, document и other файлов без скачивания;
- размер файла;
- бейдж статуса, если проект ещё не опубликован и открыт владельцем/админом.

Download-кнопок пока нет намеренно: на этом этапе нужен предпросмотр, а не публичная раздача исходников.

3D-preview ограничен форматами `.glb` и `.gltf`. Это осознанное MVP-решение: эти форматы хорошо поддерживаются браузерным viewer-компонентом без серверной конвертации. Более “рабочие” авторские форматы вроде `.fbx`, `.obj`, `.blend` и `.stl` пока показываются как файлы проекта, но не открываются inline, потому что для качественного просмотра им обычно нужен отдельный pipeline: конвертация, обработка материалов, текстур, масштаба и предпросмотр ошибок.

Личный кабинет теперь тоже подключён к backend. После входа страница `#account` вызывает `GET /api/projects/me` и показывает проекты текущего пользователя со всеми статусами: `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`. Это отличается от публичного каталога: каталог намеренно показывает только опубликованные проекты, а кабинет нужен именно для контроля своего workflow.

Карточки `DRAFT` и `REJECTED` в кабинете ведут в редактор `#project/:id/edit`. Для `REJECTED` проекта карточка показывает причину отклонения, чтобы автор видел, что именно нужно исправить перед повторной отправкой.

Admin UI доступен по `#admin` только пользователям с ролью `ADMIN`. В seed-данных есть готовый администратор:

```text
admin@creatur.local
password123
```

На странице модерации можно смотреть проекты по статусам `PENDING`, `PUBLISHED`, `REJECTED` и `ALL`, открывать detail page проекта, публиковать или отклонять работы. При отклонении админ обязан указать причину: она сохраняется в `Project.moderationNote` и показывается автору в личном кабинете и на detail page отклонённого проекта. Это уже не просто кнопка “нет”, а первый нормальный feedback loop для автора.

Поиск и фильтры тоже уходят в API query params. Например:

```text
GET /api/projects?search=куб&category=3d
GET /api/projects?category=blender&category=fantasy
```

Backend сохраняет текущую UI-семантику фильтров: внутри одной группы работает OR, между разными группами работает AND. Например, `Blender + Fantasy` означает “проект должен быть Blender и Fantasy”, а несколько выбранных тематик внутри одной группы означают “любая из выбранных тематик”.

Такой fallback выбран намеренно: frontend можно всё ещё открыть и показать как статический прототип, но при запущенном backend он уже начинает жить на настоящих данных.

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
- `GET /api/projects?category=3D` — фильтр проектов по категории;
- `GET /api/projects?search=куб` — поиск по названию, описанию и автору;
- `GET /api/projects?search=куб&category=3d` — поиск и фильтр одновременно;
- `GET /api/projects?category=blender&category=fantasy` — grouped filter semantics: OR внутри группы, AND между группами;
- `GET /api/projects/:id` — detail DTO конкретного проекта; публично только для `PUBLISHED`, приватные статусы только owner/admin;
- `GET /api/projects/me` — проекты текущего пользователя, включая непубличные статусы;
- `POST /api/projects` — создание проекта;
- `PATCH /api/projects/:id` — редактирование `DRAFT`/`REJECTED` проекта владельцем или админом;
- `POST /api/projects/:id/submit` — отправка `DRAFT`/`REJECTED` проекта на модерацию;
- `POST /api/projects/:id/files` — загрузка нескольких файлов только в `DRAFT`/`REJECTED`;
- `DELETE /api/projects/:id/files/:fileId` — удаление файла проекта только в `DRAFT`/`REJECTED`;
- `GET /api/projects/:id/files/:fileId/preview` — защищённый preview image/video и `.glb/.gltf` файлов;
- `POST /api/projects/:id/like` — лайк;
- `DELETE /api/projects/:id/like` — убрать лайк;
- `GET /api/admin/projects?status=PENDING` — список проектов для модерации;
- `GET /api/admin/projects?status=ALL` — все проекты для админа;
- `POST /api/admin/projects/:id/publish` — публикация проекта;
- `POST /api/admin/projects/:id/reject` — отклонение проекта с обязательной причиной `{ "reason": "..." }`;
- `GET /api/admin/users` — список пользователей для будущей админки пользователей.

`/api/projects` отдаёт DTO, а не сырые Prisma records. Это важно: frontend получает стабильную форму данных, а backend не раскрывает лишние поля вроде `passwordHash` или внутренних relation-объектов.

Для 3D-preview frontend использует `<model-viewer>` из `@google/model-viewer`, подключённый pinned CDN-скриптом в `frontend/index.html`. Сейчас frontend остаётся статическим без bundler-сборки, поэтому такой вариант проще и честнее: проект можно открыть локальным static server’ом, а когда появится полноценная frontend-сборка, dependency можно перенести в `package.json`.

Пример project DTO:

```json
{
  "id": "water-orb",
  "title": "Чужой открытый проект",
  "description": "Экспериментальная работа с прозрачными материалами, свечением и плавным движением.",
  "status": "PUBLISHED",
  "moderationNote": null,
  "author": {
    "id": "user-id",
    "name": "Олег Фрост",
    "avatar": "/assets/extracted/project-public-foreign/image-05.png"
  },
  "image": "/assets/extracted/project-public-foreign/image-01.png",
  "files": [
    {
      "id": "file-id",
      "url": "/api/projects/water-orb/files/file-id/preview",
      "name": "cover.png",
      "mimeType": "image/png",
      "sizeBytes": 473422,
      "kind": "IMAGE",
      "sortOrder": 0
    }
  ],
  "categoryLabels": ["ИИ-креаторы", "Дизайнеры", "Sci-fi"],
  "categorySlugs": ["ai", "design", "sci-fi"],
  "likes": 229,
  "views": 1200
}
```

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

### PostgreSQL

PostgreSQL теперь основной режим разработки. Он ближе к production-like окружению, лучше подходит для реальной модерации, ролей, связей, будущих миграций и переноса проекта между машинами.

На текущем ПК PostgreSQL уже установлен и проверен:

- служба `postgresql-x64-17` запущена;
- порт `127.0.0.1:5432` открыт;
- создана база `creatur`;
- создан пользователь `creatur`;
- pgAdmin показывает данные seed-базы.

Для PostgreSQL используется основная Prisma schema:

- `backend/prisma/schema.prisma`;
- `docker-compose.yml`;
- scripts в `package.json`.

### SQLite

SQLite остаётся как быстрый fallback “без PostgreSQL”. Он полезен, если нужно быстро поднять проект на другом ПК, проверить frontend/backend без установки сервера БД или временно продолжить работу при проблемах с PostgreSQL.

Для SQLite используется отдельная schema:

- `backend/prisma/schema.sqlite.prisma`;
- `backend/prisma/init-sqlite.mjs`;
- `npm run prisma:push:sqlite`.

Важно: основной путь разработки теперь PostgreSQL. SQLite не удаляем, но рассматриваем как convenience/dev fallback, а не как целевую базу.

### Nodemailer

Nodemailer нужен, потому что продуктово уже требуется отправка писем:

- после регистрации;
- для сброса пароля.

Если `SMTP_URL` пустой, используется JSON transport. Это значит, что локально backend создаёт email payload, но не отправляет реальные письма.

### Zod

Zod используется для validation на входе routes. Так API сразу отсекает неправильные payload'ы и возвращает понятные `400` вместо случайных runtime-ошибок глубже в коде.

### Multer

Multer используется для `multipart/form-data` upload. Нам нужна поддержка нескольких файлов и разных форматов: изображения, видео, 3D-модели, архивы, документы.

## Запуск с PostgreSQL

Это основной текущий режим разработки.

Установить зависимости:

```powershell
cd C:\repositories\gleb_request\backend
npm install
```

`.env` должен указывать на PostgreSQL:

```env
DATABASE_URL="postgresql://creatur:creatur@localhost:5432/creatur?schema=public"
```

Подготовить PostgreSQL schema и Prisma Client:

```powershell
npm run prisma:push:postgres
```

Заполнить seed-данные:

```powershell
npm run prisma:seed
```

Seed создаёт категории, демо-авторов и 8 опубликованных демо-проектов. Это нужно, чтобы frontend можно было подключать к живому API без ожидания админки и ручной загрузки контента.

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

Если база ещё не создана локально, её можно создать через `psql` под пользователем `postgres`:

```powershell
$env:PGPASSWORD="ВАШ_POSTGRES_PASSWORD"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "create role creatur with login password 'creatur' createdb;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "create database creatur owner creatur;"
```

В этом проекте локально уже использованы:

```text
database: creatur
user: creatur
password: creatur
```

## Быстрый запуск без PostgreSQL SQLite

Этот режим нужен, когда PostgreSQL не установлен или нужно быстро проверить проект без внешней базы.

Сгенерировать SQLite dev.db и Prisma Client:

```powershell
cd C:\repositories\gleb_request\backend
npm run prisma:push:sqlite
```

Заполнить seed-данные:

```powershell
npm run prisma:seed
```

Запустить backend:

```powershell
npm run dev
```

SQLite-файлы не коммитятся:

```gitignore
*.db
```

Чтобы вернуться на PostgreSQL после SQLite, снова выполните:

```powershell
npm run prisma:push:postgres
npm run prisma:seed
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
  pick["User selects files in upload UI"]
  create["POST /api/projects<br/>create DRAFT project"]
  upload["POST /api/projects/:id/files<br/>multipart FormData"]
  multer["Multer saves files<br/>to backend uploads/"]
  classify["Infer file kind<br/>image, video, model, archive, document"]
  cover["First image becomes coverFileId<br/>if cover is empty"]
  submit["POST /api/projects/:id/submit<br/>DRAFT -> PENDING"]
  detail["Open #project/:id<br/>owner/admin can view private status"]
  preview["GET /api/projects/:id/files/:fileId/preview<br/>protected image/video/model preview"]
  moderation["Future admin moderation<br/>PENDING -> PUBLISHED or REJECTED"]

  pick --> create
  create --> upload
  upload --> multer
  multer --> classify
  classify --> cover
  cover --> submit
  submit --> detail
  detail --> preview
  submit --> moderation
```

Почему именно так:

- проект создаётся отдельно от файлов, потому что файлам нужен `projectId`;
- upload идёт через `FormData`, потому что браузер сам выставляет multipart boundary;
- первый image-файл становится обложкой, чтобы detail page мог сразу показать результат;
- публичный каталог всё равно показывает только `PUBLISHED`, поэтому новые работы после загрузки не попадают наружу без модерации;
- raw `/uploads` не является публичным route: preview всегда проходит через backend access check;
- `.glb/.gltf` идут по тому же защищённому preview route, что и картинки/видео, поэтому приватная модель не раскрывается отдельной публичной ссылкой.

### Edit and Resubmit Flow

```mermaid
flowchart TD
  rejected["Project is DRAFT or REJECTED"]
  editor["Frontend #project/:id/edit"]
  patch["PATCH /api/projects/:id<br/>title, description, categories"]
  addFiles["POST /api/projects/:id/files<br/>optional new files"]
  deleteFiles["DELETE /api/projects/:id/files/:fileId<br/>optional cleanup"]
  submit["POST /api/projects/:id/submit<br/>DRAFT/REJECTED -> PENDING"]
  frozen["PENDING / PUBLISHED<br/>editing blocked with 409"]
  queue["Admin moderation queue"]

  rejected --> editor
  editor --> patch
  editor --> addFiles
  editor --> deleteFiles
  patch --> submit
  addFiles --> submit
  deleteFiles --> submit
  submit --> queue
  frozen -->|"PATCH / upload / delete"| frozen
```

Почему именно так:

- автор может исправить отклонённую работу без создания нового проекта;
- старая `moderationNote` очищается при повторной отправке, потому что начинается новая проверка;
- `PENDING` заморожен, чтобы модератор смотрел стабильную версию;
- `PUBLISHED` заморожен, чтобы публичный каталог не менялся без отдельного workflow редактирования опубликованных работ;
- если upload запрещён после проверки статуса, backend удаляет только что сохранённые Multer-файлы, чтобы локальное `uploads/` не засорялось мусором от неуспешных запросов.

### Project Visibility and File Preview Flow

```mermaid
flowchart TD
  request["GET /api/projects/:id"]
  project{"Project status"}
  published["PUBLISHED<br/>visible to everyone"]
  private["DRAFT / PENDING / REJECTED"]
  session{"Session user?"}
  owner["Owner or ADMIN<br/>visible"]
  hidden["404<br/>do not reveal existence"]
  preview["GET /api/projects/:id/files/:fileId/preview"]
  previewable{"IMAGE / VIDEO / GLB / GLTF?"}
  inline["Inline preview<br/>img, video or model-viewer"]
  noPreview["415<br/>listed, but no download/preview yet"]

  request --> project
  project -->|published| published
  project -->|private| private
  private --> session
  session -->|owner/admin| owner
  session -->|anonymous/other user| hidden
  published --> preview
  owner --> preview
  preview --> previewable
  previewable -->|yes| inline
  previewable -->|no| noPreview
```

Такой поток нужен, чтобы пользовательские upload-файлы не становились публичными просто потому, что лежат на диске. Публичность определяется статусом проекта и ролью пользователя, а не URL файла.

### Admin Moderation Flow

```mermaid
flowchart TD
  login["Admin logs in<br/>admin@creatur.local"]
  page["Frontend #admin"]
  list["GET /api/admin/projects<br/>status=PENDING"]
  dto["Project DTO<br/>same safe shape as catalog"]
  decision{"Moderator decision"}
  publish["POST /api/admin/projects/:id/publish"]
  note["Textarea<br/>required rejection reason"]
  reject["POST /api/admin/projects/:id/reject<br/>reason saved as moderationNote"]
  catalog["Public catalog<br/>GET /api/projects"]
  hidden["Hidden from catalog<br/>reason visible to owner/admin"]

  login --> page
  page --> list
  list --> dto
  dto --> decision
  decision -->|"ready"| publish
  decision -->|"not ready"| note
  note --> reject
  publish --> catalog
  reject --> hidden
```

Admin endpoints тоже возвращают DTO, а не сырые Prisma-записи. Даже в админском UI не нужно протаскивать `passwordHash`, внутренние relation-объекты или BigInt-поля в браузер: безопаснее держать один стабильный контракт для карточек проекта.

Когда проект публикуется, `moderationNote` очищается. Когда проект повторно отправляется на модерацию через `POST /api/projects/:id/submit`, старая причина отклонения тоже очищается. Это сделано специально: новая попытка должна проходить свежую проверку, а старый комментарий не должен выглядеть как актуальная ошибка.

### My Projects Flow

```mermaid
flowchart TD
  login["User is logged in"]
  account["Frontend #account"]
  mine["GET /api/projects/me"]
  dto["Project DTO list<br/>all owned statuses"]
  cards["Account project cards<br/>with status pill"]
  rejectedReason["Rejected project card<br/>shows moderationNote"]
  upload["Upload new project"]
  pending["Project appears as PENDING"]
  admin["Admin publishes or rejects"]

  login --> account
  account --> mine
  mine --> dto
  dto --> cards
  dto --> rejectedReason
  upload --> pending
  pending --> account
  pending --> admin
```

`/api/projects/me` существует отдельно от `/api/projects`, потому что эти endpoints отвечают на разные вопросы:

- `/api/projects` — что можно публично показать всем пользователям;
- `/api/projects/me` — что принадлежит текущему пользователю и в каком workflow-статусе находится.

Frontend специально использует отдельный renderer для карточек кабинета. Публичная карточка не показывает статус модерации, а личная карточка показывает бейдж `Черновик`, `На модерации`, `Опубликован` или `Отклонён`.

### Frontend Catalog Data Flow

```mermaid
flowchart TD
  home["Главная страница frontend"]
  fallback["Локальные fallbackProjects"]
  fetch["GET /api/projects<br/>search + category params"]
  detail["GET /api/projects/:id"]
  dto["Project DTO from backend"]
  mapper["mapApiProject<br/>DTO -> текущий UI формат"]
  grid["Карточки каталога"]
  page["Страница проекта"]

  home --> fallback
  home --> fetch
  fetch -->|успех| dto
  dto --> mapper
  mapper --> grid
  fetch -->|ошибка или backend выключен| fallback
  fallback --> grid
  home --> detail
  detail --> dto
  mapper --> page
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
    string moderationNote
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

Код должен быть прокомментирован подробнее, чем в минималистичном production-стиле. Для этого проекта комментарии — часть документации и передачи контекста: лучше оставить немного “лишнее” пояснение, чем через месяц заново угадывать, почему route, DTO или upload-flow устроены именно так.

Комментарий может объяснять не только “почему”, но и “как читать этот блок”, если место связывает frontend, backend, базу данных или временный MVP-обход. Особенно это важно сейчас, пока проект переходит от статического макета к full-stack приложению.

Комментируем обязательно:

- auth/security decisions;
- работу с cookie/JWT;
- password reset и хранение token hash;
- различия SQLite/PostgreSQL;
- upload limits;
- временные dev-обходы;
- frontend/backend bridge-слой;
- DTO mapping;
- статусные переходы проектов;
- admin moderation decisions;
- места, которые позже должны быть заменены production-реализацией.

Можно комментировать и слегка очевидные места, если комментарий помогает быстрее войти в код. Например, допустимо пояснить, почему состояние хранится локально внутри renderer-функции, почему кнопка открывает file picker или почему список перерисовывается целиком после действия.

Всё ещё не стоит комментировать буквально каждую строку вроде “создаём переменную” или “возвращаем ответ”, если это совсем не добавляет смысла. Но баланс смещён в сторону более подробного, учебного и поддерживаемого кода.

README должен обновляться после каждого значимого шага. В нём нужно фиксировать:

- что изменилось;
- как это запустить;
- зачем выбран такой подход;
- что является временным;
- что проверить;
- какой следующий шаг.

## Проверки

Во время backend/frontend setup были успешно выполнены:

```powershell
node --check frontend\app.js
npm run build
npm audit --audit-level=high
git diff --check
```

SQLite backend был проверен вручную:

- `/health` вернул `200`;
- `/api/categories` вернул `200`;
- `/api/projects` вернул 8 опубликованных проектов;
- `/api/projects?category=3D` вернул 4 проекта;
- `/api/projects?search=куб` вернул 1 проект;
- `/api/projects?category=blender&category=fantasy` вернул 1 проект;
- `/api/projects?search=куб&category=3d` вернул 1 проект;
- `/api/projects?search=not-found-value` вернул 0 проектов;
- `/api/projects/water-orb` вернул detail DTO;
- frontend catalog получил API-ready project DTO и сохраняет fallback на mock-данные;
- регистрация вернула `201`;
- `/api/auth/me` вернул `200`;
- логин вернул `200`;
- password reset request вернул `204`;
- frontend на `http://127.0.0.1:4173` вернул `200`;
- backend upload smoke test создал тестового пользователя, создал проект, загрузил файл и перевёл проект в `PENDING`;
- старый публичный `/uploads/<file>` вернул `404`;
- приватный `PENDING` проект вернул `404` для анонимного пользователя;
- тот же `PENDING` проект вернул `200` владельцу;
- image preview приватного проекта вернул `200` владельцу и `404` анонимному пользователю;
- `.glb/.gltf` подключены к тому же защищённому preview route и к browser viewer на detail page;
- admin login под `admin@creatur.local` вернул роль `ADMIN`;
- `/api/admin/projects?status=PENDING` вернул очередь модерации;
- `/api/admin/projects?status=PUBLISHED` вернул опубликованные проекты;
- admin moderation smoke test создал временный проект и перевёл его `PENDING -> REJECTED` с сохранением `moderationNote`;
- edit/resubmit smoke test создал проект, загрузил файл, получил `REJECTED`, обновил title/description/categories, добавил новый файл, удалил старый файл и вернул проект в `PENDING`;
- попытки редактировать, добавлять и удалять файлы у `PENDING` проекта вернули `409`;
- `/api/projects/me` smoke test создал временного пользователя, создал проект, отправил его на модерацию и получил его в кабинете как `PENDING`.

## Следующие шаги

Рекомендуемый порядок:

1. Сделать frontend-friendly DTO для категорий, сгруппированных под текущую UI-структуру фильтров.
2. Подключить frontend-фильтры к `/api/categories`.
3. Добавить upload smoke test именно с `.glb` fixture, чтобы проверять не только код, но и реальную загрузку модели.
4. Добавить email-уведомление автору при публикации/отклонении проекта.
5. Подключить более аккуратный UI выбора/редактирования категорий из backend, а не фиксированные кнопки формы.
6. Подготовить production-like PostgreSQL migration path и инструкцию переноса на другой ПК.
