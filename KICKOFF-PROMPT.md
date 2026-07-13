# Kickoff prompt — paste this into Claude Code on the web

> You are building an internal CRM from the spec in this repo. First, read these files — they are the source of truth: **CLAUDE.md, BTL-CRM-Framework.md, schema.sql, development-roadmap.md**.
>
> Build **V0 ONLY**, exactly as defined in `development-roadmap.md`. Two modules:
> 1. **College mapping** — CRUD + list/preview for colleges, college_streams, and contacts; a stream board grouped by stage; import the "Bangalore Event Planner" data if I provide it.
> 2. **Daily logging** — an interaction logger (date, channel, summary, tag stream(s) + contact(s), all_streams marker) that advances a stream's stage and sets its next step + next-action date; stage-driven forms from the `stage_field_requirements` table; a "my follow-ups due" list.
>
> **Explicit non-goals for V0 (do not build):** no access control or roles — single shared access, everyone sees and edits everything (but users still log in individually so interactions record who did them); no events / speaker / clash features; no reporting, dashboards, or forecasting.
>
> **Stack:** Next.js (App Router) + TypeScript; Supabase (Postgres) for data and auth; deploy on Vercel. Match table and column names to `schema.sql` exactly; mirror the DB enums in the app types. The schema has already been applied to Supabase by me.
>
> **Secrets:** read Supabase config only from environment variables — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Never hardcode or commit keys; ensure `.env*` is in `.gitignore`. Use the anon key in the browser and the service-role key server-side only.
>
> **How to work:** before writing any code, reply with a short V0 build plan — the project structure, the screens you'll build, and the order you'll build them. Wait for my approval. Then build in small increments, opening a pull request for each working step so I can review it and preview it on Vercel.
>
> Give me the plan now.
