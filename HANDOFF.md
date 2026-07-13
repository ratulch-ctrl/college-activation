# Handoff to Claude Code — Setup & Kickoff

A step-by-step to go from these design docs to a running V0 build.

## A. Prerequisites (one-time)

**On your computer**
- OS: macOS 13+, Windows 10/11 (with WSL), or Linux. 8 GB RAM recommended.
- **Claude Code** installed:
  - Mac/Linux/WSL: `curl -fsSL https://claude.ai/install.sh | bash`
  - Windows PowerShell: `irm https://claude.ai/install.ps1 | iex`
  - (native installer needs no Node.js; verify with `claude --version`)
- **Node.js 18+** — needed to run the Next.js app itself (`node --version`).
- **Git** + a code editor (VS Code recommended).
- An **Anthropic account** for Claude Code (Pro / Max / Team / API).

**Accounts to create (all free to start)**
- **GitHub** — to hold the repo.
- **Supabase** — the database. Create a project; copy the Project URL + anon/service keys.
- **Vercel** or **Cloudflare Pages** — hosting (can wait until V0 works locally).

## B. Set up the project folder
This folder (`BTL CRM`) already holds the design docs and `CLAUDE.md`. Point Claude Code here so it picks up context automatically.

```
cd "path/to/BTL CRM"
claude
```

Claude Code auto-reads `CLAUDE.md` and can open `schema.sql`, `BTL-CRM-Framework.md`, and `development-roadmap.md`.

## C. First prompt to paste into Claude Code

> Read CLAUDE.md, BTL-CRM-Framework.md, schema.sql, and development-roadmap.md in this folder.
> We're building **V0 only** (college mapping + daily logging), with **no access control** — single shared access.
> Before writing code, give me a short build plan for V0: the Next.js + Supabase project structure, how you'll apply schema.sql to Supabase, and the screens you'll build. Wait for my OK before scaffolding.

That makes it plan first, so you can course-correct before any code is written.

## D. Suggested build order inside V0 (tell Claude Code to go phase by phase)
1. Scaffold Next.js + connect Supabase (env vars, run `schema.sql`).
2. College mapping: colleges → streams → contacts CRUD + list/preview + stream board.
3. Import the existing "Bangalore Event Planner" sheet as seed data.
4. Daily logging: interaction logger + stage transitions + stage-driven forms + follow-ups.
5. Deploy to Vercel/Cloudflare.

Have it commit to Git after each working step so you can roll back.

## E. Secrets — important
- Put Supabase keys in `.env.local`; never commit them. Ensure `.env*` is in `.gitignore`.
- Use the **anon key** in the browser; keep the **service-role key** server-side only.

## What to keep doing here (Cowork) vs there (Claude Code)
- **Here:** design changes, data cleanup/import prep, reviewing decisions, updating these docs.
- **Claude Code:** the actual build, running/testing, deploying.
