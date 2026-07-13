# BTL College Activities CRM

Internal CRM for tracking BTL (field-marketing) college activities for a study-abroad business — college mapping and BDMs' daily progress logging. Built cloud-first: **Claude Code on the web → GitHub → Vercel → Supabase**, no local setup.

## Repo contents (the spec Claude Code builds from)
| File | What it is |
|---|---|
| `CLAUDE.md` | Project context — auto-read by Claude Code. Start here. |
| `BTL-CRM-Framework.md` | Data model + design rationale (the *what* and *why*). |
| `schema.sql` | PostgreSQL schema — tables, enums, FKs, views, seed config. |
| `er-diagram.mermaid` | Visual of the data model. |
| `development-roadmap.md` | Phase plan. **We build V0 first.** |
| `KICKOFF-PROMPT.md` | The exact prompt to paste into Claude Code. |
| `HANDOFF.md` | Reference notes (local option). |

## How to start (all in the browser — no terminal)

**1. Put this repo on GitHub**
Create a new repo and upload these files (GitHub web → "Add file" → "Upload files" → drag the zip's contents in).

**2. Apply the schema to Supabase**
The schema is code, in `supabase/migrations/`. Two ways to apply it:
- **First time (quick):** Supabase → **SQL Editor** → paste `supabase/migrations/0001_init_schema.sql` → **Run**.
- **Ongoing (automated):** connect Supabase's **GitHub integration** to this repo so new migration files auto-apply on merge. After this, you never touch Supabase by hand — Claude Code writes a migration, you merge the PR, the change applies itself.

**Data safety:** migrations are additive by default and never wipe data. Destructive changes (`DROP`, resets) are forbidden on the live DB — see the rules in `CLAUDE.md`. `schema.sql` is the readable snapshot; `supabase/migrations/` is what actually runs.

**3. Grab your Supabase keys**
Supabase → **Settings → API** → copy the **Project URL**, **anon public** key, and **service_role** key. You'll add these to Vercel (step 5). Do **not** put them in the repo.

**4. Start Claude Code on the web**
Go to **claude.ai/code**, connect this GitHub repo, and paste the prompt from `KICKOFF-PROMPT.md`. It will reply with a build plan first — approve it, then it builds V0 and opens pull requests.

**5. Connect Vercel (for live previews)**
In Vercel → **Add New Project** → import this GitHub repo. Under the project's **Environment Variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
- `SUPABASE_SERVICE_ROLE_KEY` = your service_role key

Now every pull request Claude Code opens gets an automatic **preview URL** you can click to test. Merge a PR → it deploys.

## The loop
Claude Code (browser) builds → opens a PR → Vercel preview URL → you review/test → merge → deploys. Everything stays in the cloud.

## Scope guardrail
V0 = college mapping + daily logging, single shared access. **No** roles, events, speaker-clash, or forecasting yet — those are later phases in `development-roadmap.md`.
