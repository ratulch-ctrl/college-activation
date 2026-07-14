-- ============================================================================
-- Additive: new college profile fields + competitor tracking table.
-- Nullable columns, new types, new table — no existing data is touched.
-- ============================================================================

CREATE TYPE internal_priority_tier AS ENUM ('A','B','C');
CREATE TYPE competitor_strength    AS ENUM ('STRONG','MODERATE','WEAK');

ALTER TABLE colleges
    ADD COLUMN google_maps_link      TEXT,                          -- field-nav link, replaces free-text address (dropped in 0003)
    ADD COLUMN affiliation           TEXT,                          -- e.g. "Autonomous", "Affiliated to VTU", "Deemed University"
    ADD COLUMN accreditation         TEXT,                          -- official record as reported, e.g. "NAAC A++", "NIRF 151-200"
    ADD COLUMN internal_priority_tier internal_priority_tier;        -- team's own prioritization tier

-- Structured competitor tracking: multiple competitors per college.
CREATE TABLE college_competitors (
    id               SERIAL PRIMARY KEY,
    college_id       INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    competitor_name  TEXT NOT NULL,
    strength         competitor_strength,
    active_since     DATE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitors_college ON college_competitors(college_id);

-- Add a derived "is_activated" column to the existing pipeline-rollup view:
-- true once any of the college's streams has moved past IDENTIFIED. Appended
-- as a trailing column via CREATE OR REPLACE, so this is a pure addition —
-- engagement_scope (still present on colleges at this point) is untouched,
-- and no existing view column is removed or reordered.
CREATE OR REPLACE VIEW v_college_rollup AS
SELECT c.id, c.name, c.city_id, c.engagement_scope,
       COUNT(cs.id)                                              AS total_streams,
       COUNT(*) FILTER (WHERE cs.is_active)                      AS active_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'CONFIRMED')            AS confirmed_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'COMPLETED')            AS completed_streams,
       COALESCE(bool_or(cs.stage <> 'IDENTIFIED'), FALSE)        AS is_activated
FROM colleges c
LEFT JOIN college_streams cs ON cs.college_id = c.id
GROUP BY c.id;
