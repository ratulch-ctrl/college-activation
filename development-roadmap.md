# BTL CRM — Phased Development Roadmap

Reordered around the real foundation: **college mapping + how BDMs log daily progress.**
V0 has a **single shared access level — no roles, no access control.** That's deferred until it's actually needed.

---

## V0 — The base: college mapping + daily logging  *(the foundation)*
**Goal:** the college/stream picture and the BDM's daily workflow, live and shared by everyone.

**Minimal plumbing (not a feature, just needed to run):** Next.js app + free Supabase (`schema.sql`), one shared login, deployed to a URL. No roles — everyone sees and edits everything.

**College mapping**
- CRUD + list/preview screens for **colleges** (with `engagement_scope`), **college_streams** (stage, final-year batch strength, owner, next step), and **contacts** (multi-contact: TPO / HOD / Principal, stream-linked).
- **Stream board** — see every college's streams and what stage each is at, at a glance.
- **Import** the existing "Bangalore Event Planner" sheet as the starting data.

**Daily logging (BDM progress)**
- **Interaction logger**: date, channel, raw "what happened" summary, tag the stream(s) + contact(s) spoken to, `all_streams` marker.
- Logging an interaction **advances the stream stage** and sets the next step + next-action date.
- **Stage-driven forms** from `stage_field_requirements` — the fields you must fill depend on the stage you're moving into.
- **"My follow-ups due"** list per BDM.

**Done when:** a BDM runs their whole day in the app — sees where every stream stands and logs progress — with no spreadsheet.

---

## V1 — Events & speaker orchestration
**Goal:** manage confirmed events without clashes and capture what happened.

- Create **events** from confirmed streams; link `event_streams` (incl. combined-department events).
- Map **speakers** (internal / university rep) + accompanying `event_assignees`.
- **Clash detection** surfaced before saving a speaker; calendar view of events.
- Post-event **actuals**: attended, forms collected, prospects, walk-ins.

**Done when:** events are scheduled, speakers assigned clash-free, and outcomes recorded.

---

## V2 — Descriptive reporting  *(counting, not prediction)*
**Goal:** turn the logged data into simple, immediately-useful views. No forecasting model.

- **Pipeline rollup** — stream stage counts per college / city / BDM.
- **Attendance actuals** — expected pool vs TPO-promised vs actual attended, side by side per event.
- **Agent scorecard** — weekly walk-ins vs target, per branch (basic aggregation).
- Per-event **funnel** — registered → attended → forms → prospects → walk-ins.

**Done when:** Deepthi opens one screen and sees pipeline + weekly output + how turnout compared to expectations.

---

## V3 — Access control & roles
**Goal:** now that the tool is in real use, scope who sees/edits what.

- Roles on `team_members` (`MANAGER`, `BDM`, `BRANCH_EXECUTIVE`…): Managers see all, BDMs their own colleges/streams, branch execs their branch metrics.
- Audit trail of who changed what.

**Done when:** access matches the org, without changing any earlier feature.

---

## V4 — Later (data-dependent / nice-to-have)
- **Predictive attendance forecasting** — learn the historical attended ÷ batch-pool ratio and predict turnout for upcoming events; flag over-promising TPOs. *Only meaningful once V1/V2 have logged enough completed events.*
- **Student-level leads** (`student_leads`) — feedback-form submissions as records; event counts become derived.
- Notifications/reminders (WhatsApp/email follow-up nudges), weekly CSV backup export, bulk edit, mobile/offline field capture.

---

### Sequence
**V0 (ship + let the team use it)** → V1 → V2 → V3 → V4.
Forecasting (V4) waits for real historical data. Access control (V3) waits until the tool is genuinely in daily use.
