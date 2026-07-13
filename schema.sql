-- ============================================================================
-- BTL College Activities CRM — v2 schema (PostgreSQL)
-- Scope: event + aggregate funnel, driven at COLLEGE + STREAM level.
--
-- Core ideas in v2:
--  * The pipeline lives on the STREAM, not the college. Each (college, stream)
--    has its own stage, owner, batch strength and next step.
--  * A college-level engagement_scope marks ALL_STREAMS vs SELECTED_STREAMS.
--  * `interactions` is the day-to-day activity log (raw updates); each entry
--    tags the stream(s) and contact(s) involved and can advance a stage.
--  * `stage_field_requirements` drives the dynamic per-stage forms.
--  * Speakers are mapped to events with clash detection (v_speaker_clashes).
--  * Final-year batch strength is captured per stream for turnout forecasting.
-- ============================================================================

-- ---------- Enums ----------------------------------------------------------
CREATE TYPE team_role         AS ENUM ('MANAGER','BDM','BRANCH_EXECUTIVE','COUNSELOR','EC','VP');
CREATE TYPE college_category  AS ENUM ('ENGINEERING','DEGREE','MANAGEMENT','UNIVERSITY','OTHER');
CREATE TYPE engagement_scope  AS ENUM ('ALL_STREAMS','SELECTED_STREAMS');
CREATE TYPE stream_stage      AS ENUM ('IDENTIFIED','CONTACTED','IN_DISCUSSION','AGREED','CONFIRMED','COMPLETED','DORMANT','REJECTED');
CREATE TYPE contact_role      AS ENUM ('TPO','HOD','PRINCIPAL','PLACEMENT_COORDINATOR','FACULTY','OTHER');
CREATE TYPE interaction_channel AS ENUM ('VISIT','CALL','EMAIL','WHATSAPP','OTHER');
CREATE TYPE activity_type     AS ENUM ('SEMINAR','MOCK_TEST','EDUCATION_FAIR','FLYER_DISTRIBUTION','HELP_DESK');
CREATE TYPE event_status      AS ENUM ('PLANNED','CONFIRMED','SCHEDULED','COMPLETED','CANCELLED','POSTPONED');
CREATE TYPE target_year       AS ENUM ('FINAL','PRE_FINAL','THIRD','SECOND','COMBINED');
CREATE TYPE speaker_type      AS ENUM ('INTERNAL','UNIVERSITY_REP','EXTERNAL_PARTNER');
CREATE TYPE requirement_scope AS ENUM ('STREAM','EVENT');

-- ---------- Geography & org ------------------------------------------------
CREATE TABLE cities (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    state       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE branches (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    city_id     INTEGER NOT NULL REFERENCES cities(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (city_id, name)
);

CREATE TABLE team_members (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    role        team_role NOT NULL,
    email       TEXT UNIQUE,
    phone       TEXT,
    city_id     INTEGER REFERENCES cities(id),
    branch_id   INTEGER REFERENCES branches(id),
    manager_id  INTEGER REFERENCES team_members(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speakers: internal counselors OR external university reps / partners
CREATE TABLE speakers (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    type           speaker_type NOT NULL DEFAULT 'INTERNAL',
    organization   TEXT,                                   -- university / partner name if external
    team_member_id INTEGER REFERENCES team_members(id),    -- set when the speaker is internal
    phone          TEXT,
    email          TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Colleges, streams, contacts ------------------------------------
CREATE TABLE colleges (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    city_id           INTEGER NOT NULL REFERENCES cities(id),
    category          college_category NOT NULL DEFAULT 'OTHER',
    engagement_scope  engagement_scope NOT NULL DEFAULT 'SELECTED_STREAMS',  -- all vs specific streams
    is_paid_partner   BOOLEAN NOT NULL DEFAULT FALSE,
    owner_bdm_id      INTEGER REFERENCES team_members(id),
    address           TEXT,
    website           TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (city_id, name)
);

-- THE PIPELINE UNIT: one row per (college, stream). Stage lives here.
CREATE TABLE college_streams (
    id                     SERIAL PRIMARY KEY,
    college_id             INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    stream_name            TEXT NOT NULL,               -- "Computer Science", "AI & ML", "ECE", "MBA"...
    department             TEXT,                         -- optional grouping / school
    stage                  stream_stage NOT NULL DEFAULT 'IDENTIFIED',
    is_active              BOOLEAN NOT NULL DEFAULT TRUE, -- currently being pursued?
    final_year_strength    INTEGER,                      -- rough batch size, final year (forecast base)
    pre_final_year_strength INTEGER,
    owner_bdm_id           INTEGER REFERENCES team_members(id),
    primary_contact_id     INTEGER,                      -- FK added after college_contacts (circular)
    current_next_step      TEXT,
    next_action_date       DATE,
    last_interaction_at    TIMESTAMPTZ,
    notes                  TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (college_id, stream_name)
);
CREATE INDEX idx_streams_college ON college_streams(college_id);
CREATE INDEX idx_streams_stage   ON college_streams(stage);
CREATE INDEX idx_streams_nextact ON college_streams(next_action_date);

-- Multiple contacts per college (TPO, HOD, Principal...). HOD can map to a stream.
CREATE TABLE college_contacts (
    id                SERIAL PRIMARY KEY,
    college_id        INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    college_stream_id INTEGER REFERENCES college_streams(id),  -- set for stream-specific contacts (e.g. HOD)
    name              TEXT NOT NULL,
    role              contact_role NOT NULL DEFAULT 'OTHER',
    department        TEXT,
    phone             TEXT,
    email             TEXT,
    is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_college ON college_contacts(college_id);

ALTER TABLE college_streams
    ADD CONSTRAINT fk_stream_primary_contact
    FOREIGN KEY (primary_contact_id) REFERENCES college_contacts(id);

-- ---------- Day-to-day interaction log (raw updates) -----------------------
CREATE TABLE interactions (
    id               SERIAL PRIMARY KEY,
    college_id       INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    team_member_id   INTEGER NOT NULL REFERENCES team_members(id),   -- who did the visit/call
    interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    channel          interaction_channel NOT NULL DEFAULT 'VISIT',
    all_streams      BOOLEAN NOT NULL DEFAULT FALSE,   -- marker: applied to all streams
    summary          TEXT NOT NULL,                    -- raw "what happened" update
    outcome          TEXT,
    resulting_stage  stream_stage,                     -- stage this interaction advanced the stream(s) to
    next_step        TEXT,
    next_action_date DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interactions_college ON interactions(college_id);
CREATE INDEX idx_interactions_date    ON interactions(interaction_date);

-- which stream(s) an interaction touched (ignored when all_streams = true)
CREATE TABLE interaction_streams (
    interaction_id    INTEGER NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    college_stream_id INTEGER NOT NULL REFERENCES college_streams(id) ON DELETE CASCADE,
    PRIMARY KEY (interaction_id, college_stream_id)
);

-- which contact(s) were spoken to in an interaction
CREATE TABLE interaction_contacts (
    interaction_id INTEGER NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    contact_id     INTEGER NOT NULL REFERENCES college_contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (interaction_id, contact_id)
);

-- ---------- Stage-driven dynamic form config -------------------------------
-- The app reads this to decide which fields to show/require at each stage.
CREATE TABLE stage_field_requirements (
    id          SERIAL PRIMARY KEY,
    stage       stream_stage NOT NULL,
    applies_to  requirement_scope NOT NULL DEFAULT 'STREAM',
    field_key   TEXT NOT NULL,        -- e.g. 'final_year_strength', 'scheduled_date', 'speaker'
    field_label TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    UNIQUE (stage, field_key)
);

-- ---------- Events (created once a stream is CONFIRMED) --------------------
CREATE TABLE events (
    id                     SERIAL PRIMARY KEY,
    college_id             INTEGER NOT NULL REFERENCES colleges(id),
    city_id                INTEGER NOT NULL REFERENCES cities(id),
    owner_bdm_id           INTEGER REFERENCES team_members(id),

    activity_type          activity_type NOT NULL,
    target_year            target_year,

    -- schedule (start/end used for speaker clash detection)
    date_text              TEXT,                 -- raw fuzzy value e.g. "July 4th week"
    scheduled_date         DATE,
    start_time             TIME,
    end_time               TIME,
    date_status            TEXT,
    status                 event_status NOT NULL DEFAULT 'PLANNED',

    -- plan
    expected_speaker_type  TEXT,
    expected_student_min   INTEGER,              -- optional event-level override of stream pool
    expected_student_max   INTEGER,
    tpo_promised_count     INTEGER,
    amount                 NUMERIC(10,2) DEFAULT 0,
    is_paid                BOOLEAN NOT NULL DEFAULT FALSE,
    lab_or_laptop_required BOOLEAN NOT NULL DEFAULT FALSE,
    lab_or_laptop_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    remarks                TEXT,

    -- actual
    actual_registered      INTEGER,
    actual_attended        INTEGER,
    forms_collected        INTEGER,
    prospects_count        INTEGER,
    walkins_count          INTEGER,
    enrolled_count         INTEGER,
    completed_at           TIMESTAMPTZ,
    feedback_form_link     TEXT,

    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);
CREATE INDEX idx_events_college ON events(college_id);
CREATE INDEX idx_events_status  ON events(status);
CREATE INDEX idx_events_date    ON events(scheduled_date);

-- an event can cover one OR several streams (e.g. CS + AI combined in one hall)
CREATE TABLE event_streams (
    event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    college_stream_id INTEGER NOT NULL REFERENCES college_streams(id),
    PRIMARY KEY (event_id, college_stream_id)
);

-- speaker(s) mapped to an event (is_lead marks the primary speaker)
CREATE TABLE event_speakers (
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    speaker_id INTEGER NOT NULL REFERENCES speakers(id),
    is_lead    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (event_id, speaker_id)
);

-- team members accompanying the speaker (help desk, parallel support)
CREATE TABLE event_assignees (
    event_id       INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_member_id INTEGER NOT NULL REFERENCES team_members(id),
    role_at_event  TEXT,
    PRIMARY KEY (event_id, team_member_id)
);

-- ---------- Agent accountability (weekly, event-independent) ---------------
CREATE TABLE weekly_agent_metrics (
    id                   SERIAL PRIMARY KEY,
    team_member_id       INTEGER NOT NULL REFERENCES team_members(id),
    branch_id            INTEGER REFERENCES branches(id),
    week_start_date      DATE NOT NULL,
    target_walkins       INTEGER NOT NULL DEFAULT 5,
    actual_walkins       INTEGER NOT NULL DEFAULT 0,
    prospects            INTEGER NOT NULL DEFAULT 0,
    enrolled             INTEGER NOT NULL DEFAULT 0,
    btl_activities_count INTEGER NOT NULL DEFAULT 0,
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (team_member_id, week_start_date)
);

-- ============================================================================
-- Reporting views
-- ============================================================================

-- 1. Stream pipeline board (pipeline visibility)
CREATE VIEW v_stream_pipeline AS
SELECT cs.id, c.name AS college, cs.stream_name, cs.stage, cs.is_active,
       cs.final_year_strength, cs.pre_final_year_strength,
       cs.current_next_step, cs.next_action_date, cs.last_interaction_at,
       tm.name AS owner_bdm, c.city_id
FROM college_streams cs
JOIN colleges c ON c.id = cs.college_id
LEFT JOIN team_members tm ON tm.id = cs.owner_bdm_id;

-- 2. College rollup — stream stage counts per college
CREATE VIEW v_college_rollup AS
SELECT c.id, c.name, c.city_id, c.engagement_scope,
       COUNT(cs.id)                                              AS total_streams,
       COUNT(*) FILTER (WHERE cs.is_active)                      AS active_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'CONFIRMED')            AS confirmed_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'COMPLETED')            AS completed_streams
FROM colleges c
LEFT JOIN college_streams cs ON cs.college_id = c.id
GROUP BY c.id;

-- 3. Expected turnout pool per event (sum of linked streams' batch strength)
CREATE VIEW v_event_expected_pool AS
SELECT e.id AS event_id,
       SUM(cs.final_year_strength)                    AS final_year_pool,
       SUM(COALESCE(cs.pre_final_year_strength,0))    AS pre_final_pool
FROM events e
JOIN event_streams est ON est.event_id = e.id
JOIN college_streams cs ON cs.id = est.college_stream_id
GROUP BY e.id;

-- 4. Historical attendance rate by activity type (forecast basis)
CREATE VIEW v_attendance_history AS
SELECT e.activity_type,
       COUNT(*) AS completed_events,
       ROUND(AVG(e.actual_attended::numeric / NULLIF(p.final_year_pool,0)), 2) AS avg_attendance_rate
FROM events e
JOIN v_event_expected_pool p ON p.event_id = e.id
WHERE e.status = 'COMPLETED' AND e.actual_attended IS NOT NULL AND p.final_year_pool > 0
GROUP BY e.activity_type;

-- 5. Attendance forecast for upcoming events (pool x historical rate)
CREATE VIEW v_attendance_forecast AS
SELECT e.id, e.scheduled_date, e.activity_type, p.final_year_pool,
       h.avg_attendance_rate, h.completed_events AS sample_size,
       ROUND(p.final_year_pool * h.avg_attendance_rate) AS predicted_attendance
FROM events e
JOIN v_event_expected_pool p ON p.event_id = e.id
LEFT JOIN v_attendance_history h ON h.activity_type = e.activity_type
WHERE e.status IN ('CONFIRMED','SCHEDULED');

-- 6. Speaker clash detection — same speaker, overlapping time, live events
CREATE VIEW v_speaker_clashes AS
SELECT es1.speaker_id, s.name AS speaker, e1.scheduled_date,
       e1.id AS event_a, e1.start_time AS a_start, e1.end_time AS a_end,
       e2.id AS event_b, e2.start_time AS b_start, e2.end_time AS b_end
FROM event_speakers es1
JOIN event_speakers es2 ON es2.speaker_id = es1.speaker_id AND es2.event_id > es1.event_id
JOIN events e1 ON e1.id = es1.event_id
JOIN events e2 ON e2.id = es2.event_id
JOIN speakers s ON s.id = es1.speaker_id
WHERE e1.scheduled_date = e2.scheduled_date
  AND e1.status NOT IN ('CANCELLED','POSTPONED')
  AND e2.status NOT IN ('CANCELLED','POSTPONED')
  AND (
        e1.start_time IS NULL OR e2.start_time IS NULL          -- same-day, times unknown => flag
        OR (e1.start_time < COALESCE(e2.end_time, e2.start_time)
            AND e2.start_time < COALESCE(e1.end_time, e1.start_time))
      );

-- 7. Agent scorecard — weekly actual vs target
CREATE VIEW v_agent_scorecard AS
SELECT t.id AS team_member_id, t.name, t.role, b.name AS branch,
       m.week_start_date, m.target_walkins, m.actual_walkins,
       (m.actual_walkins >= m.target_walkins) AS hit_target,
       m.prospects, m.enrolled, m.btl_activities_count
FROM weekly_agent_metrics m
JOIN team_members t ON t.id = m.team_member_id
LEFT JOIN branches b ON b.id = m.branch_id;

-- ============================================================================
-- Seed: stage-driven field requirements (drives dynamic forms)
-- ============================================================================
INSERT INTO stage_field_requirements (stage, applies_to, field_key, field_label, is_required, sort_order) VALUES
 ('IDENTIFIED',   'STREAM','stream_name',            'Stream',                       TRUE, 1),
 ('IDENTIFIED',   'STREAM','final_year_strength',    'Final-year batch strength',    TRUE, 2),
 ('CONTACTED',    'STREAM','primary_contact_id',     'Primary contact (TPO/HOD)',    TRUE, 1),
 ('CONTACTED',    'STREAM','next_action_date',       'Next follow-up date',          TRUE, 2),
 ('IN_DISCUSSION','STREAM','proposed_activity',      'Proposed activity type',       TRUE, 1),
 ('IN_DISCUSSION','STREAM','next_action_date',       'Next follow-up date',          TRUE, 2),
 ('AGREED',       'EVENT', 'activity_type',          'Activity type',                TRUE, 1),
 ('AGREED',       'EVENT', 'expected_student_max',   'Expected students',            TRUE, 2),
 ('AGREED',       'EVENT', 'lab_or_laptop_required', 'Lab/laptop needed (mock)',     FALSE,3),
 ('CONFIRMED',    'EVENT', 'scheduled_date',         'Event date',                   TRUE, 1),
 ('CONFIRMED',    'EVENT', 'start_time',             'Start time',                   TRUE, 2),
 ('CONFIRMED',    'EVENT', 'speaker',                'Assigned speaker',             TRUE, 3),
 ('CONFIRMED',    'EVENT', 'tpo_promised_count',     'TPO promised headcount',       TRUE, 4),
 ('COMPLETED',    'EVENT', 'actual_attended',        'Actual attendance',            TRUE, 1),
 ('COMPLETED',    'EVENT', 'forms_collected',        'Feedback forms collected',     TRUE, 2),
 ('COMPLETED',    'EVENT', 'prospects_count',        'Prospects (asked questions)',  TRUE, 3),
 ('COMPLETED',    'EVENT', 'walkins_count',          'Walk-ins generated',           FALSE,4);
