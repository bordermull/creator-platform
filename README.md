# creator-platform

Monorepo for the CREATUR platform.

## Structure

```text
frontend/  Static MVP based on the Figma concept
backend/   API scaffold for auth, catalog, uploads, and admin workflows
docs/      Product and backend notes, plus source design files
```

## Run Frontend

Run a local static server:

```powershell
cd frontend
node tools/static-server.js
```

Then open `http://127.0.0.1:4173`.

You can also open `index.html` directly in a browser for a quick static preview.

## Run Backend Without Docker

Use this mode when Docker Desktop is unavailable. It stores local development data in SQLite:

```powershell
cd backend
npm install
npm run prisma:push:sqlite
npm run prisma:seed
npm run dev
```

The API runs on `http://127.0.0.1:3000`.

## Run Backend With PostgreSQL

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Prepare and run the API:

```powershell
cd backend
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

The API runs on `http://127.0.0.1:3000`.

## Current Frontend Scope

- Home page before and after authentication
- Catalog grid with extracted Figma assets
- Login and registration modal states
- Profile page
- Upload project page
- Project detail page
- Responsive layout for desktop and mobile

## Backend Direction

The backend MVP uses email/password auth, registration and password reset emails, regular users plus one admin role, fixed categories/tags, multi-file project uploads, project statuses, likes, and views.
