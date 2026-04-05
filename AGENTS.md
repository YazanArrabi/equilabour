# EquiLabour Repository Instructions

## Project summary

EquiLabour is a LinkedIn-like recruitment platform.

Current architecture is locked:
- Monolithic backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- REST API only
- Frontend: React + Vite
- No microservices
- No queues
- No background jobs
- No WebSockets

## Core implementation rules

- Do not change stack or architecture.
- Do not introduce speculative features.
- Do not refactor unrelated code.
- Keep implementations minimal, deterministic, and correctness-first.
- Prefer small explicit modules over abstractions.
- Do not rewrite working files unless required.

## Required workflow

Before making changes:
1. Propose implementation first unless explicitly asked to apply immediately.
2. Show:
   - files to create or modify
   - purpose of each file
   - request flow / control flow
   - validation strategy
   - assumptions
3. Then show full code.
4. Wait for approval before applying changes unless explicitly told to apply.

When applying approved changes:
- apply only the approved scope
- do not make unrelated edits
- do not “improve” or “clean up” outside scope
- preserve existing naming and structure

## Backend standards

### API
- REST only
- success response: `{ success: true, data }`
- error response: `{ success: false, error: { code, message } }`

### Validation
- Use zod for request validation
- Reject unknown fields unless explicitly intended
- Do not silently accept invalid input

### Auth
- JWT access token in HTTP-only cookie
- Refresh token stored hashed in DB
- Refresh token rotation required
- Use existing auth middleware and patterns
- Do not expose sensitive fields

### Permissions
- Users can edit only their own data
- All authenticated users can view other profiles read-only
- Workers cannot edit company data
- Companies cannot edit worker data
- Only companies manage jobs
- Only workers apply to jobs
- Only owning company manages applications

## Prisma / database rules

Use the existing schema as source of truth.

Important model constraints already exist:
- User role: worker | company
- Job application statuses: pending | accepted | rejected
- No "reviewed" status
- One application per worker per job
- Job posting uses soft delete via status
- AIAnalysisResult is stored and read-only
- RefreshToken is stored and rotated

Do not change schema casually.
If a schema change is truly required:
- justify it explicitly
- explain migration impact
- do not mix schema changes with unrelated business logic

## AI rules

AI is supportive, not part of live search.

- AI runs synchronously after worker profile updates or relevant file uploads
- AI output is stored in DB
- AI output is read-only for users
- AI is not used in normal search request paths
- Do not implement background processing

If AI is not part of the current task:
- leave a clear stub/comment only
- do not invent fake AI behavior

## File handling rules

- Private storage only
- Do not expose S3 internals to clients unless required
- Respect ownership and immutability rules
- Do not add upload logic unless the task explicitly requires it

## Review guidelines

When reviewing or changing code, explicitly check:
- authorization and ownership enforcement
- validation completeness
- schema alignment
- response format consistency
- state transition correctness
- no sensitive data exposure
- no architecture drift

## Testing expectations

For backend work:
- prefer minimal reproducible manual test steps
- use curl examples when practical
- do not claim something works unless it was actually verified or the limitation is stated clearly

## OpenAI / Codex docs usage

Always use the OpenAI developer documentation MCP server when working with:
- OpenAI API
- Codex
- MCP
- AGENTS.md
- SDK behavior

Do not guess OpenAI product behavior when official docs are available.

## Current project state

Already implemented:
- Prisma schema and migration
- Auth module
  - register
  - login
  - refresh
  - logout
  - me
- Auth has been manually tested and is working

Current next priority:
- profile module
- then jobs
- then applications
- then files
- then AI integration
- then frontend