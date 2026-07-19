# Backend Plan

## Product Scope

CREATUR is a portfolio/catalog platform for creative projects. The frontend is currently a static MVP, and the backend should turn the existing screens into real workflows without forcing a full frontend redesign.

## MVP Decisions

- Authentication: email and password.
- Email: registration confirmation/welcome emails and password reset emails.
- Roles: one admin role and regular users.
- Project publishing: projects use statuses so moderation and drafts can exist without changing the UI later.
- Uploads: support multiple files and multiple formats from the start.
- Social features: include likes and views in MVP; postpone comments and subscriptions until the core catalog is stable.
- Categories: fixed category/reference data managed by the system.
- Tags: fixed tags/reference data for filtering consistency.

## Core Entities

### User

- id
- email
- passwordHash
- displayName
- bio
- avatarFileId
- role: `admin` or `user`
- emailVerifiedAt
- createdAt
- updatedAt

### PasswordResetToken

- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt

### Project

- id
- ownerId
- title
- description
- coverFileId
- status: `draft`, `pending`, `published`, `rejected`, `archived`
- publishedAt
- createdAt
- updatedAt

### ProjectFile

- id
- projectId
- uploaderId
- storageKey
- originalName
- mimeType
- sizeBytes
- kind: `image`, `video`, `model`, `archive`, `document`, `other`
- sortOrder
- createdAt

### Category

- id
- slug
- name
- group: `section`, `software`, `content`, `theme`
- isActive
- sortOrder

### ProjectCategory

- projectId
- categoryId

### Like

- userId
- projectId
- createdAt

### ProjectView

- id
- projectId
- viewerId
- anonymousKey
- createdAt

## API Draft

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/submit`
- `POST /api/projects/:id/publish`
- `POST /api/projects/:id/reject`
- `POST /api/projects/:id/like`
- `DELETE /api/projects/:id/like`

### Files

- `POST /api/projects/:id/files`
- `DELETE /api/projects/:id/files/:fileId`
- `PATCH /api/projects/:id/files/reorder`

### References

- `GET /api/categories`

### Admin

- `GET /api/admin/projects`
- `POST /api/admin/projects/:id/publish`
- `POST /api/admin/projects/:id/reject`
- `GET /api/admin/users`

## Repository Shape

```text
frontend/
backend/
docs/
```

The current static frontend can be moved into `frontend/` before backend scaffolding. The backend can then expose `/api/*`, while the frontend keeps its current behavior until mock data is replaced by API calls.

## Recommended Backend Stack

- Node.js
- TypeScript
- Express or NestJS
- PostgreSQL
- Prisma
- JWT/session auth with httpOnly cookies
- Local file storage for development, S3-compatible storage later
- SMTP provider for registration and password reset emails

## First Backend Milestone

1. Restructure the repo into `frontend/`, `backend/`, and `docs/`.
2. Scaffold backend with TypeScript.
3. Add Prisma schema for users, projects, files, categories, likes, and views.
4. Add auth endpoints with email/password.
5. Add password reset token flow and email adapter.
6. Seed fixed categories based on the current frontend filters.
7. Add project list/detail endpoints.
8. Connect the frontend catalog to `GET /api/projects`.
