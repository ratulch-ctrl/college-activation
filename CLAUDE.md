# BTL College Activities CRM — Project Context

This file is read automatically by Claude Code. It orients any build session.

## What this is
An internal CRM for tracking BTL (field-marketing) college activities for a study-abroad business. Field team (BDMs, branch executives) runs seminars / IELTS mock tests / education fairs at colleges to collect student leads. Managed regionally (Bangalore & Bhubaneswar) by a senior manager (Deepthi).

## Read these first (in this folder)
- `BTL-CRM-Framework.md` — the data model and design rationale. Source of truth for *what* and *why*.
- `schema.sql` — PostgreSQL schema (tables, enums, FKs, views, seed config). Apply as the first migration.
- `er-diagram.mermaid` — visual of the model.
- `development-roadmap.md` — the phase plan. **We are building V0.**

## Core model (don't re-derive — see framework)
- The pipeline lives on the **stream** (`college_streams`), not the college. Each (college, stream) has its own stage: `IDENTIFIED → CONTACTED → IN_DISCUSSION → AGREED → CONFIRMED → COMPLETED`.
- College carries an `engagement_scope` (ALL vs SELECTED streams).
- `interactions` is the daily activity log; entries tag stream(s) + contact(s) and advance stages.
- `stage_field_requirements` drives which fields are required per stage (dynamic forms).
- Multi-contact per college (TPO / HOD / Principal).
- Events + speaker clash detection and forecasting are **later phases**, not V0.

## Stack (decided)
- **DB:** Supabase (free tier), Postgres. Apply `schema.sql`.
- **App:** Next.js (App Router) + TypeScript. ORM optional (Prisma or supabase-js).
- **Hosting:** Vercel or Cloudflare Pages. Secrets (Supabase URL/keys) via env vars — never commit them.

## V0 scope (build this, nothing more)
1. **College mapping** — CRUD + list/preview for colleges, college_streams, contacts; a stream board grouped by stage; import the existing "Bangalore Event Planner" sheet.
2. **Daily logging** — interaction logger (date, channel, summary, tag streams + contacts, all_streams marker) that advances stream stage and sets next step / next-action date; stage-driven forms from `stage_field_requirements`; a "my follow-ups due" list.

## V0 guardrails (explicit non-goals)
- **No access control / roles.** Single shared access — everyone sees and edits everything. (Users still log in individually so interactions record who did them.)
- **No events / speaker / clash features** (that's V1).
- **No reporting dashboards or forecasting** (V2 / V4).
- Keep storage access behind a thin data layer so the backend is swappable later.

## Database changes & data safety (READ EVERY TIME YOU TOUCH THE SCHEMA)
All schema changes are **incremental migration files** in `supabase/migrations/`, applied automatically (Supabase GitHub integration / CLI on merge). Never edit tables by hand in the Supabase UI.

**Hard rules — the database holds real, irreplaceable field data:**
- **NEVER re-run the full `schema.sql`, run `supabase db reset`, `DROP`/`TRUNCATE`, or otherwise recreate the DB against a database that has data.** Structure and data are separate; a structure change must never wipe rows.
- **Only additive migrations by default:** `CREATE TABLE`, `ADD COLUMN` (nullable or with a default). These don't touch existing rows.
- **Destructive changes** (`DROP COLUMN`/`TABLE`, lossy type changes, `NOT NULL` on a populated column) require an explicit, separately-reviewed migration. Flag them clearly in the PR and never bundle them silently.
- **Renames / type changes use the safe multi-step pattern:** add new → backfill/copy → switch app → drop old later (only after verification).
- Each schema change = one new migration file (never mutate an already-applied migration). Test on a Supabase **branch/preview DB** before it reaches production.
- Every migration must be visible in the PR diff so a human can veto a destructive statement before merge.

`schema.sql` is the human-readable snapshot of the full model; `supabase/migrations/` is the source of truth that actually gets applied.

## Conventions
- Match table/column names to `schema.sql` exactly.
- Enums live in the DB; mirror them in the app types.
- Prefer simple, legible screens over polish — this replaces a spreadsheet for a field team.
