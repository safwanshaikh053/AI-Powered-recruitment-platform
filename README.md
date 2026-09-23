# Recruitment Platform — Phase 1

AI-powered recruitment & talent management platform. This commit contains
**Phase 1 only**: project scaffolding, folder architecture, and the
skeleton auth/AI/email/storage service boundaries. No feature UI yet.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL ·
Auth.js v5 · Zod · React Hook Form · Recharts · UploadThing · Resend

## What's implemented in Phase 1
- Full folder structure (`app/`, `components/`, `lib/`, `actions/`,
  `services/`, `types/`, `hooks/`, `config/`)
- Prisma schema with `User` + Auth.js required models (`Account`,
  `Session`, `VerificationToken`) and `UserRole` / `UserStatus` enums
- Auth.js credentials provider wired to Prisma, with role in the JWT/session
- `middleware.ts` enforcing role-based route protection at the edge for
  `/candidate`, `/recruiter`, `/admin`
- `lib/permissions` — server-side `requireAuth()` / `requireRole()` helpers
  every action and route handler must call (middleware is never the only
  authorization check)
- Vendor-agnostic interfaces for `lib/ai`, `lib/email`, `lib/storage` —
  implemented in Phases 8, 19, 7 respectively
- Tailwind + CSS variables set up for shadcn/ui and dark/light theming

## Not yet implemented (upcoming phases)
Everything domain-specific: candidate/recruiter/job/application models,
the actual login/register forms, dashboards, resume processing, AI
matching, interviews, notifications, seed data, tests. See the phase list
in the project brief.

## Local setup
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET at minimum
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Generate an `AUTH_SECRET` with:
```bash
openssl rand -base64 32
```

## Verifying this phase
```bash
npm run typecheck
npm run lint
npm run build
```
All three should pass before moving to Phase 2 (full database schema).
