# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EquiLabour is a LinkedIn-like recruitment platform. The architecture is **locked** — do not change the stack or introduce microservices, queues, background jobs, or WebSockets.

## Development Commands

All commands run from repo root using pnpm workspaces.

```bash
# Install dependencies
pnpm install

# Backend API (Express + TypeScript, hot-reload via tsx)
pnpm --filter api dev

# Frontend (React + Vite)
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint

# Prisma (run from apps/api)
pnpm --filter api prisma:migrate      # Run migrations
pnpm --filter api prisma:generate     # Regenerate client after schema changes
pnpm --filter api prisma:format       # Format schema
pnpm --filter api prisma:validate     # Validate schema
```

## Architecture

**Monorepo:** `apps/api` (Express backend), `apps/web` (React frontend), `packages/shared` (minimal shared code).

**Backend request flow:** JSON/cookie parser middleware → optional `requireAuth` → Zod validation → service → Prisma → typed response.

**Auth:** JWT access token (15min) in HTTP-only cookie + refresh token (7 days) stored **hashed** in DB with rotation. Cookie names: `accessToken`, `refreshToken`. Env vars: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

**API response contract:**
- Success: `{ success: true, data }`
- Error: `{ success: false, error: { code, message } }`

**Prisma client** is generated to `apps/api/generated/prisma/client` (non-default path — always import from there, not `@prisma/client`).

**File storage:** AWS S3 with presigned URLs. Private storage only — do not expose S3 internals to clients.

**AI integration:** Anthropic Claude SDK. AI runs synchronously after profile updates; output stored in `AIAnalysisResult` and is read-only for users. AI is **not** in the normal search path.

## Key Constraints

**Permissions:**
- Users edit only their own data
- All authenticated users can view other profiles (read-only)
- Only companies manage jobs; only workers apply to jobs
- Only the owning company manages applications

**Schema constraints (do not alter without justification):**
- `role`: `worker | company`
- Application status: `pending | accepted | rejected` (no "reviewed")
- One application per worker per job
- Job soft-delete via `status` field
- `AIAnalysisResult` is stored and read-only

**Validation:** Use Zod; reject unknown fields by default.

## Required Workflow

Before making any changes:
1. Propose the implementation plan first (files to create/modify, request/control flow, validation strategy, assumptions).
2. Show the full code.
3. Wait for approval before applying, unless explicitly told to apply immediately.

When applying: only apply the approved scope — no unrelated edits, no "improvements" outside scope.

## Implementation Priorities (in order)

1. Profile module ← current focus
2. Jobs module
3. Applications module
4. Files module
5. AI integration
6. Frontend

## Testing Approach

Prefer minimal reproducible manual test steps with curl examples. Do not claim something works unless it was actually verified.
