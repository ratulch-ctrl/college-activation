# BTL College Activities CRM — Base Framework (v2)

**Scope:** event + aggregate funnel, but the whole system is driven at **college + stream** granularity — because that's how the work actually happens on the ground. Individual students are still out of scope for v1 (they live in the feedback-form export); designed so student-level records plug in later.

**What changed from v1:** the pipeline is no longer a single stage per college. It's **per stream**, fed by a **day-to-day interaction log**, with **stage-driven forms**, **multi-contact engagement**, and **speaker orchestration with clash detection**. Batch strength is captured per stream so we can forecast turnout.

---

## 1. The central shift: the pipeline lives on the stream

A college is not "in one stage." At any moment a BDM might be deep in discussion with Computer Science, just introduced to AI & ML, and have never touched Civil. So the pipeline unit is **`college_stream`** — one row per (college, stream), each carrying its own:

- **stage** — `IDENTIFIED → CONTACTED → IN_DISCUSSION → AGREED → CONFIRMED → COMPLETED` (plus `DORMANT` / `REJECTED`)
- **owner BDM**, **primary contact**, **current next step + next-action date**
- **final-year batch strength** (and pre-final) — the rough headcount that anchors every turnout expectation
- **is_active** — is this stream currently being pursued?

At the college level there's a single marker, **`engagement_scope` = `ALL_STREAMS` | `SELECTED_STREAMS`**, so at a glance you know whether the BDM is going after the whole institution or a chosen few. Individual streams can still be toggled active/inactive underneath that.

So visibility works top-down: *College → its streams → each stream's stage and next step.* A BDM opening a college sees exactly where every stream stands.

---

## 2. Day-to-day entry: the interaction log

This is the thing BDMs actually touch daily. **`interactions`** is a raw activity feed — "went to Mount Carmel today, met the TPO and the CS HOD, they're interested but want dates after Aug 20."

Each interaction captures:

- **who logged it** (team member), **date**, **channel** (visit / call / email / WhatsApp)
- **summary** — the raw "what happened" note, in their words
- **which stream(s)** it touched (`interaction_streams`), or an **`all_streams` marker** when the update applies college-wide
- **which contact(s)** were spoken to (`interaction_contacts`) — so you can talk to the TPO, an HOD, and the Principal in one visit and record all three
- **resulting stage** + **next step** + **next-action date** — the interaction is what *advances* a stream's stage

The stream row always shows the latest position; the interaction log is the history of how it got there. Nothing is a black box — every stage change traces back to a logged conversation.

## 3. Stage-driven forms

Rather than one giant form, the fields a BDM must fill are a function of the stage they're moving a stream into. That mapping is **data, not code** — it lives in **`stage_field_requirements`**, which the UI reads to render the right form. Ship-with defaults:

| Moving to… | Fields that become required |
|---|---|
| **IDENTIFIED** | stream, final-year batch strength |
| **CONTACTED** | primary contact (TPO/HOD), next follow-up date |
| **IN_DISCUSSION** | proposed activity type, next follow-up date |
| **AGREED** | activity type, expected students, lab/laptop needed (if mock) |
| **CONFIRMED** | event date, start time, **assigned speaker**, TPO promised headcount |
| **COMPLETED** | actual attendance, forms collected, prospects, walk-ins |

Because it's a config table, Deepthi can change what's mandatory at each stage without a rebuild.

---

## 4. Multiple contacts per college

Contacts are first-class and plural. A college has a TPO, one HOD per department, a Principal, placement coordinators — and a BDM works several of them at once. **`college_contacts`** supports:

- **role** (`TPO / HOD / PRINCIPAL / PLACEMENT_COORDINATOR / FACULTY / OTHER`)
- an optional **link to a specific stream** — so a CS HOD attaches to the CS stream, while the TPO sits at the college level
- **is_primary** per stream (who's driving that stream)

Interactions reference contacts many-to-many, so "met TPO + CS HOD together" is one log entry tagged with both.

---

## 5. Speaker orchestration + clash detection

Once a stream hits **CONFIRMED**, an **event** is created and a **speaker** must be mapped. Speakers (`speakers`) can be **internal** counselors or **external** university reps / partners.

- **`event_speakers`** maps one or more speakers to an event (`is_lead` marks the primary).
- **`event_assignees`** records the team members accompanying the speaker (help desk, parallel support) — so the full orchestration of who's where is tracked.
- Events carry **`scheduled_date` + `start_time` + `end_time`**, which powers **`v_speaker_clashes`**: it flags any speaker booked into two overlapping events on the same day (and flags same-day bookings where times aren't set yet). Check this view before confirming a speaker so you never double-book.

---

## 6. Batch strength → turnout forecasting

When a stream is first opened, the BDM records the **rough final-year batch strength** (`college_streams.final_year_strength`). Everything downstream leans on it:

- An event links to its stream(s) via `event_streams`; **`v_event_expected_pool`** sums their batch strengths into the addressable pool.
- **`v_attendance_history`** learns the actual attended ÷ pool ratio by activity type from completed events.
- **`v_attendance_forecast`** multiplies an upcoming event's pool by that historical rate → a **predicted attendance** with a sample-size confidence signal.

That's the direct answer to "we know CS final year is ~120 — are we actually going to get that many in the room?"

---

## 7. Views shipping in v1

`v_stream_pipeline` (stream kanban) · `v_college_rollup` (stage counts per college) · `v_event_expected_pool` · `v_attendance_history` · `v_attendance_forecast` · `v_speaker_clashes` · `v_agent_scorecard` (weekly walk-in target vs actual).

## 8. Recommended build (for Claude Code)

- **DB:** PostgreSQL — `schema.sql` has tables, enums, FKs, indexes, the seven views, and seeded stage-form config.
- **Stack:** Next.js (App Router) + Prisma (`prisma db pull` off `schema.sql`), or your choice — SQL is portable.
- **Key screens:** college page with a **stream board** + inline **interaction logger**; a **stage-transition form** that reads `stage_field_requirements`; an **event scheduler** that runs the clash check before saving a speaker; a **forecast** panel; a weekly **agent scorecard** grid.
- **Roles:** map `team_members.role` — Managers see all cities, BDMs their colleges/streams, branch execs their branch metrics.

## 9. Phase 2 (designed-for)

Add `student_leads` (one row per feedback-form submission) FK'd to `events` and to an assigned counselor, with a lifecycle mirroring the funnel. The event's aggregate counts then derive from lead rows instead of being hand-entered — the core doesn't change.

---

*See `schema.sql` for the DDL and `er-diagram.mermaid` for the visual model.*
