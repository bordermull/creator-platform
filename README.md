# CREATUR / creator-platform

<p align="center">
  <img src="frontend/assets/logo.svg" alt="CREATUR" width="260" />
</p>

CREATUR — учебная full-stack платформа для публикации, модерации и просмотра творческих проектов: 3D, дизайн, game art, digital art, motion, кодовые прототипы и смежные направления.

Проект не является коммерческим production-сервисом. Это небольшой заказ для студента бакалавриата, поэтому главная цель — не промышленная инфраструктура, а цельный демонстрационный продукт: понятная архитектура, рабочие пользовательские сценарии, локальный запуск из GitHub, подробные комментарии в коде и документация, которую можно использовать на сдаче/защите.

## Содержание

- [Что реализовано](#что-реализовано)
- [Демонстрационные роли](#демонстрационные-роли)
- [Быстрый запуск](#быстрый-запуск)
- [Запуск с PostgreSQL](#запуск-с-postgresql)
- [Быстрый запуск без PostgreSQL SQLite](#быстрый-запуск-без-postgresql-sqlite)
- [Демонстрационные сценарии](#демонстрационные-сценарии)
- [Визуальный обзор](#визуальный-обзор)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Frontend](#frontend)
- [Backend и API](#backend-и-api)
- [Модель данных](#модель-данных)
- [Ключевые продуктовые решения](#ключевые-продуктовые-решения)
- [Проверки](#проверки)
- [Ограничения учебного проекта](#ограничения-учебного-проекта)
- [Что игнорируется Git](#что-игнорируется-git)
- [Политика комментариев и документации](#политика-комментариев-и-документации)
- [Дальнейшее развитие](#дальнейшее-развитие)

## Что реализовано

Проект начинался как статический frontend-MVP по Figma-концепту. Сейчас это monorepo с frontend и backend:

```text
frontend/  Статический HTML/CSS/JS интерфейс
backend/   Express + TypeScript + Prisma API
docs/      План backend и исходные дизайн-экраны
```

Основные готовые возможности:

- регистрация пользователя;
- вход, выход и проверка текущей cookie-сессии;
- роли `USER` и `ADMIN`;
- email-flow для регистрации и сброса пароля через Nodemailer;
- публичный каталог опубликованных проектов;
- поиск и фильтрация каталога;
- категории из backend через `GET /api/categories`;
- создание проекта автором;
- загрузка нескольких файлов;
- приватное хранение upload-файлов;
- защищённый preview файлов через backend;
- предпросмотр изображений;
- предпросмотр видео;
- предпросмотр `.glb/.gltf` через `<model-viewer>`;
- личный кабинет автора со всеми его проектами;
- статусы проекта: `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`;
- админская модерация проектов;
- отклонение проекта с обязательной причиной;
- отображение причины отклонения автору;
- редактирование `DRAFT` и `REJECTED` проектов;
- повторная отправка исправленного проекта на модерацию;
- лайки проектов;
- PostgreSQL как основной режим разработки;
- SQLite fallback для быстрого запуска без PostgreSQL;
- подробная README-документация и схемы.

Проектный цикл автора уже замкнут:

```text
загрузил проект → отправил на модерацию → получил причину отклонения → исправил → снова отправил → опубликовано
```

## Демонстрационные роли

Seed создаёт готового администратора:

```text
email:    admin@creatur.local
password: password123
role:     ADMIN
```

Обычного пользователя можно создать через регистрацию в интерфейсе.

Если нужно быстро проверить разные роли:

- админ заходит через `admin@creatur.local / password123`;
- пользователь регистрируется с любым email и паролем не короче требований backend;
- админ публикует или отклоняет проекты пользователя через `#admin`.

## Быстрый запуск

Ожидаемый путь проекта:

```text
C:\repositories\gleb_request
```

Frontend и backend запускаются отдельно.

### Backend

```powershell
cd C:\repositories\gleb_request\backend
npm install
npm run prisma:push:postgres
npm run prisma:seed
npm run dev
```

Проверка backend:

```text
http://127.0.0.1:3000/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

### Frontend

Во втором терминале:

```powershell
cd C:\repositories\gleb_request\frontend
node tools/static-server.js
```

Открыть:

```text
http://127.0.0.1:4173
```

## Запуск с PostgreSQL

PostgreSQL — основной режим разработки проекта.

### 1. Установить зависимости backend

```powershell
cd C:\repositories\gleb_request\backend
npm install
```

### 2. Подготовить `.env`

Файл `backend/.env.example` коммитится как пример. Рабочий `backend/.env` не коммитится, потому что может содержать локальные пароли и секреты.

Пример локального `backend/.env`:

```env
DATABASE_URL="postgresql://creatur:creatur@localhost:5432/creatur?schema=public"
SQLITE_DATABASE_URL="file:./dev.db"
PORT=3000
FRONTEND_ORIGIN="http://127.0.0.1:4173"
JWT_SECRET="development-local-secret-change-before-production"
SMTP_URL=""
MAIL_FROM="CREATUR <noreply@creatur.local>"
UPLOAD_DIR="uploads"
```

На текущем локальном ПК использовались:

```text
database: creatur
user:     creatur
password: creatur
host:     localhost
port:     5432
```

### 3. Создать базу и пользователя, если их ещё нет

Пример через `psql` под PostgreSQL 17:

```powershell
$env:PGPASSWORD="ВАШ_POSTGRES_PASSWORD"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "create role creatur with login password 'creatur' createdb;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d postgres -c "create database creatur owner creatur;"
```

Если роль или база уже существуют, PostgreSQL сообщит об этом. Это нормально: повторно создавать их не нужно.

### 4. Применить Prisma schema и seed

```powershell
npm run prisma:push:postgres
npm run prisma:seed
```

В учебном проекте сейчас используется `prisma db push`, потому что это проще для локального запуска и переноса между ПК. Полноценные Prisma migrations оставлены как направление развития.

### 5. Запустить backend

```powershell
npm run dev
```

Проверить:

```text
http://127.0.0.1:3000/health
http://127.0.0.1:3000/api/categories
http://127.0.0.1:3000/api/projects
```

## Быстрый запуск без PostgreSQL SQLite

SQLite оставлен как отдельный режим “быстрый запуск без PostgreSQL”. Это удобно, если нужно показать проект на другом ПК и не хочется устанавливать сервер базы данных.

```powershell
cd C:\repositories\gleb_request\backend
npm install
npm run prisma:push:sqlite
npm run prisma:seed
npm run dev
```

SQLite-файлы не коммитятся:

```gitignore
*.db
```

Чтобы вернуться на PostgreSQL:

```powershell
npm run prisma:push:postgres
npm run prisma:seed
```

## Демонстрационные сценарии

Эти сценарии удобно пройти на защите, потому что они показывают почти все ключевые части системы.

### Сценарий 1. Публичный каталог

1. Запустить backend и frontend.
2. Открыть `http://127.0.0.1:4173`.
3. Убедиться, что отображаются опубликованные seed-проекты.
4. Использовать поиск.
5. Открыть фильтры.
6. Выбрать категории, например `Blender` или `Fantasy`.
7. Показать, что фильтры строятся из backend-категорий.

Что демонстрируется:

- `GET /api/categories`;
- `GET /api/projects`;
- фильтрация по `?category=slug`;
- frontend fallback на случай недоступного backend.

### Сценарий 2. Регистрация и загрузка проекта

1. Нажать регистрацию.
2. Создать обычного пользователя.
3. Открыть загрузку проекта.
4. Заполнить название и описание.
5. Выбрать категории.
6. Добавить один или несколько файлов.
7. Отправить проект.

Что демонстрируется:

- `POST /api/auth/register`;
- cookie-сессия;
- `POST /api/projects`;
- `POST /api/projects/:id/files`;
- `POST /api/projects/:id/submit`;
- переход проекта в `PENDING`.

### Сценарий 3. Модерация админом

1. Выйти из пользователя.
2. Войти как админ:

```text
admin@creatur.local
password123
```

3. Открыть `#admin`.
4. Найти проект в очереди `PENDING`.
5. Отклонить проект и указать причину.

Что демонстрируется:

- role-based access;
- admin-only UI;
- `POST /api/admin/projects/:id/reject`;
- обязательная `moderationNote`;
- проект становится `REJECTED`.

### Сценарий 4. Исправление отклонённого проекта

1. Вернуться под обычного пользователя.
2. Открыть личный кабинет.
3. Найти отклонённый проект.
4. Посмотреть причину отклонения.
5. Открыть редактор проекта.
6. Изменить текст, категории или файлы.
7. Снова отправить проект на модерацию.

Что демонстрируется:

- `GET /api/projects/me`;
- отображение `moderationNote`;
- `PATCH /api/projects/:id`;
- удаление и добавление файлов;
- повторный переход `REJECTED -> PENDING`;
- очистка старой причины отклонения.

### Сценарий 5. Публикация

1. Войти как админ.
2. Открыть модерацию.
3. Опубликовать проект.
4. Вернуться в каталог.
5. Убедиться, что проект появился публично.

Что демонстрируется:

- `POST /api/admin/projects/:id/publish`;
- переход `PENDING -> PUBLISHED`;
- публичный каталог показывает только опубликованные проекты.

### Сценарий 6. Приватность файлов и preview

1. Открыть опубликованный проект.
2. Посмотреть image/video/3D-preview.
3. Открыть неопубликованный проект как владелец.
4. Попробовать открыть его как гость.

Что демонстрируется:

- raw `/uploads/...` не раздаётся публично;
- preview идёт через `GET /api/projects/:id/files/:fileId/preview`;
- приватные статусы скрываются от гостей через `404`;
- `.glb/.gltf` показываются через `<model-viewer>`.

## Визуальный обзор

Исходные экраны из Figma/export лежат в `docs/design/` и служат визуальной базой для frontend.

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

Frontend и backend запускаются отдельно. Frontend остаётся статическим приложением на HTML/CSS/JS, но уже обращается к backend API.

```mermaid
flowchart LR
  user["Пользователь в браузере"]
  frontend["frontend<br/>HTML + CSS + JS"]
  api["backend<br/>Express + TypeScript"]
  prisma["Prisma Client"]
  postgres["PostgreSQL<br/>основная dev-база"]
  sqlite["SQLite dev.db<br/>fallback"]
  files["uploads/<br/>локальные файлы"]
  mail["Nodemailer<br/>SMTP или JSON transport"]

  user --> frontend
  frontend -->|"auth, catalog, upload, moderation"| api
  api --> prisma
  prisma --> postgres
  prisma -. "быстрый режим без PostgreSQL" .-> sqlite
  api --> files
  api --> mail
```

Главная идея архитектуры: не переписывать весь frontend сразу, а постепенно подключать реальные API. Для этого в `frontend/app.js` есть bridge-слой, который переводит backend DTO в формат, удобный текущим renderer-функциям.

## Структура репозитория

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          PostgreSQL Prisma schema
│   │   ├── schema.sqlite.prisma   SQLite fallback schema
│   │   ├── init-sqlite.mjs        Создание SQLite dev.db
│   │   └── seed.ts                Категории, пользователи, демо-проекты
│   ├── src/
│   │   ├── lib/                   Общие backend helper'ы
│   │   ├── routes/                API route-модули
│   │   ├── app.ts                 Express-приложение
│   │   ├── config.ts              Конфиг из переменных окружения
│   │   └── server.ts              Точка входа API
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── assets/                    Лого, favicon, изображения из Figma
│   ├── tools/static-server.js     Локальный static server
│   ├── app.js                     Логика frontend
│   ├── index.html
│   └── styles.css
├── docs/
│   ├── backend-plan.md
│   └── design/                    SVG-экраны из Figma
├── docker-compose.yml             Опциональный PostgreSQL
└── README.md
```

## Frontend

Frontend — статическое приложение без React/Vue. Для учебного проекта это осознанное упрощение: меньше инфраструктуры, легче объяснять работу экрана, быстрее запускать.

Frontend умеет:

- показывать публичный каталог;
- загружать категории из backend;
- строить фильтры каталога;
- выполнять поиск;
- показывать страницы проектов;
- регистрировать и авторизовывать пользователя;
- проверять текущую сессию через backend;
- показывать личный кабинет;
- создавать проект;
- редактировать `DRAFT` и `REJECTED` проекты;
- загружать и удалять файлы;
- показывать preview изображений, видео и `.glb/.gltf`;
- показывать админскую модерацию для роли `ADMIN`.

Если backend выключен или недоступен, frontend использует fallback-данные. Это нужно, чтобы статический прототип можно было открыть отдельно.

## Backend и API

Backend — Express + TypeScript API с Prisma.

Основные endpoints:

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход |
| `POST` | `/api/auth/logout` | Выход |
| `GET` | `/api/auth/me` | Проверка текущей сессии |
| `POST` | `/api/auth/password-reset/request` | Запрос сброса пароля |
| `POST` | `/api/auth/password-reset/confirm` | Подтверждение сброса пароля |
| `GET` | `/api/categories` | Активные категории |
| `GET` | `/api/projects` | Публичный каталог `PUBLISHED` проектов |
| `GET` | `/api/projects?search=...` | Поиск |
| `GET` | `/api/projects?category=slug` | Фильтр по категории |
| `GET` | `/api/projects/:id` | Detail проекта с проверкой доступа |
| `GET` | `/api/projects/me` | Проекты текущего пользователя |
| `POST` | `/api/projects` | Создание проекта |
| `PATCH` | `/api/projects/:id` | Редактирование `DRAFT` / `REJECTED` |
| `POST` | `/api/projects/:id/submit` | Отправка на модерацию |
| `POST` | `/api/projects/:id/files` | Загрузка файлов |
| `DELETE` | `/api/projects/:id/files/:fileId` | Удаление файла |
| `GET` | `/api/projects/:id/files/:fileId/preview` | Защищённый preview |
| `POST` | `/api/projects/:id/like` | Лайк |
| `DELETE` | `/api/projects/:id/like` | Удаление лайка |
| `GET` | `/api/admin/projects?status=PENDING` | Очередь модерации |
| `POST` | `/api/admin/projects/:id/publish` | Публикация |
| `POST` | `/api/admin/projects/:id/reject` | Отклонение с причиной |
| `GET` | `/api/admin/users` | Список пользователей для будущей админки |

Backend отдаёт frontend-friendly DTO, а не сырые Prisma records. Это важно, потому что frontend не должен получать `passwordHash`, внутренние relation-объекты или BigInt-поля в неудобном виде.

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

## Ключевые продуктовые решения

### Статусы проектов

```mermaid
flowchart LR
  draft["DRAFT<br/>черновик"]
  pending["PENDING<br/>на модерации"]
  published["PUBLISHED<br/>публичен"]
  rejected["REJECTED<br/>отклонён"]

  draft -->|"submit"| pending
  pending -->|"admin publish"| published
  pending -->|"admin reject + reason"| rejected
  rejected -->|"edit + resubmit"| pending
```

Почему так:

- публичный каталог показывает только `PUBLISHED`;
- `DRAFT`, `PENDING`, `REJECTED` видны только владельцу и админу;
- `PENDING` заморожен, чтобы модератор смотрел стабильную версию;
- `PUBLISHED` заморожен, чтобы публичный проект не менялся без отдельного workflow;
- `REJECTED` можно редактировать и отправлять повторно.

### Категории и фильтры

```mermaid
flowchart TD
  seed["Seed categories"]
  db["Category table<br/>slug, name, group, sortOrder"]
  api["GET /api/categories"]
  frontend["Frontend groups categories"]
  filters["Catalog filters<br/>?category=slug"]
  form["Upload/Edit form<br/>categorySlugs[]"]
  links["ProjectCategory links"]

  seed --> db
  db --> api
  api --> frontend
  frontend --> filters
  frontend --> form
  form --> links
  filters --> links
```

Группы категорий:

- `SECTION` — раздел;
- `SOFTWARE` — инструменты;
- `CONTENT` — тип проекта;
- `THEME` — тематика.

Внутри одной группы фильтры работают как OR, между группами — как AND.

Пример:

```text
Blender + Fantasy
```

означает:

```text
проект должен быть связан с Blender И Fantasy
```

### Приватность файлов

Upload-файлы не раздаются напрямую через `/uploads`. Вместо этого используется endpoint:

```text
GET /api/projects/:id/files/:fileId/preview
```

Он проверяет:

- существует ли файл;
- существует ли проект;
- имеет ли текущий пользователь право видеть проект;
- поддерживается ли inline preview для формата.

Если приватный проект открывает гость, backend возвращает `404`, а не `403`. Так API не подтверждает существование чужого черновика или отклонённого проекта.

### 3D-preview

Inline 3D-preview поддержан для:

- `.glb`;
- `.gltf`.

Используется `<model-viewer>` из `@google/model-viewer`, подключённый через pinned CDN-скрипт в `frontend/index.html`.

Другие 3D-форматы (`fbx`, `obj`, `blend`, `stl`) пока показываются как файлы проекта без inline preview. Для качественного просмотра им обычно нужен отдельный pipeline конвертации и обработки материалов, что выходит за рамки учебного MVP.

### Email

Nodemailer используется для:

- письма после регистрации;
- писем сброса пароля.

Если `SMTP_URL` пустой, backend использует JSON transport: письмо формируется, но реально не отправляется. Это удобно для локального учебного запуска.

## Проверки

В ходе разработки использовались:

```powershell
node --check frontend\app.js
npm run build
npm audit --audit-level=high
git diff --check
```

Проверенные сценарии:

- `/health` вернул `200`;
- `/api/categories` вернул `200` и 34 активные категории;
- `/api/projects` вернул опубликованные проекты;
- поиск и фильтры каталога работают;
- регистрация вернула `201`;
- логин вернул `200`;
- `/api/auth/me` вернул текущего пользователя;
- password reset request вернул `204`;
- frontend на `http://127.0.0.1:4173` вернул `200`;
- проект создаётся, получает файлы и уходит в `PENDING`;
- raw `/uploads/<file>` не является публичным route;
- приватный `PENDING` проект вернул `404` гостю и `200` владельцу;
- image preview приватного проекта вернул `200` владельцу и `404` гостю;
- `.glb/.gltf` подключены к защищённому preview route;
- админ видит очередь модерации;
- админ публикует проект;
- админ отклоняет проект с `moderationNote`;
- автор видит причину отклонения;
- автор редактирует `REJECTED` проект и отправляет повторно;
- попытки редактировать, добавлять и удалять файлы у `PENDING` проекта возвращают `409`;
- category smoke test проверил `GET /api/categories`, `category=blender`, создание и редактирование проекта с `categorySlugs`.

## Ограничения учебного проекта

Эти ограничения осознанные. Они помогают удержать проект в масштабе бакалаврской работы, а не превращать его в production-платформу.

- Нет production-деплоя, домена, HTTPS и reverse proxy.
- Нет CI/CD.
- Для PostgreSQL используется `prisma db push`, а не полноценная migration history.
- Upload-файлы хранятся локально в `backend/uploads`.
- Нет S3/MinIO или другого облачного файлового хранилища.
- Нет антивирусной проверки файлов.
- Нет фоновых очередей обработки медиа.
- Нет генерации thumbnail’ов.
- Нет конвертации `fbx/obj/blend/stl` в `glb`.
- Нет платёжных функций, тарифов или коммерческого marketplace.
- Нет сложной админки пользователей.
- Нет редактирования уже опубликованных проектов.
- Нет промышленного тестового набора; используются build-checks, smoke-tests и ручные демонстрационные сценарии.

Для учебной сдачи это приемлемо: проект показывает авторизацию, роли, базу данных, связи, загрузку файлов, модерацию, приватность и frontend/backend-интеграцию.

## Что игнорируется Git

В Git не должны попадать локальные, сгенерированные и потенциально чувствительные файлы:

- `node_modules/`;
- `dist/`;
- `.env`;
- `uploads/`;
- `*.db`;
- `*.log`.

## Политика комментариев и документации

Код специально комментируется подробнее, чем в минималистичном production-стиле. Для этого проекта комментарии — часть учебной документации и передачи контекста.

Комментируются:

- auth/security decisions;
- cookie/JWT;
- password reset;
- различия PostgreSQL и SQLite;
- upload-flow;
- DTO mapping;
- frontend/backend bridge-слой;
- статусы проектов;
- admin moderation;
- временные MVP-решения.

README нужно обновлять после каждого значимого этапа, потому что он является главным входным документом проекта.

## Дальнейшее развитие

Если проект нужно будет развивать дальше, логичный порядок такой:

1. Добавить финальную UI-полировку ошибок и пустых состояний.
2. Добавить email-уведомления автору при публикации/отклонении проекта.
3. Добавить production-like Prisma migrations.
4. Добавить deploy-инструкцию.
5. Перенести файлы в S3-compatible storage.
6. Добавить thumbnail generation.
7. Добавить конвертацию дополнительных 3D-форматов в `.glb`.
8. Расширить админку пользователей.
9. Добавить автоматизированные e2e-тесты.

Для текущей бакалаврской версии критически важнее не эти пункты, а стабильный локальный запуск, понятная демонстрация и хорошее объяснение архитектуры.
