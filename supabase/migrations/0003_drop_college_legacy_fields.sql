-- ============================================================================
-- ⚠️  DESTRUCTIVE MIGRATION — requires explicit human review before merge.
--
-- Drops 5 columns from `colleges`: address, website, notes, engagement_scope,
-- is_paid_partner. Decided in the college-data-model brainstorm:
--   - address:          superseded by google_maps_link (added in 0002)
--   - website, notes:   not needed for V0
--   - is_paid_partner:  not needed for V0
--   - engagement_scope: the actual need ("college is activated once any one
--                        stream/department is activated") is a DERIVED status,
--                        not a manually-set field — see the rebuilt
--                        v_college_rollup view below, which now exposes
--                        is_activated computed from college_streams.stage,
--                        instead of storing a redundant column.
--
-- Any data in these 5 columns will be permanently lost on apply. At the time
-- this migration was written the `colleges` table was empty (fresh project,
-- V0 not yet shipped) — reconfirm that still holds before merging if time has
-- passed.
-- ============================================================================

-- Rebuild the view first: it depends on colleges.engagement_scope, which
-- blocks the column drop below until the dependency is removed. Only the
-- engagement_scope column is dropped from the view's output here — the rest
-- (including is_activated, added in 0002) is unchanged.
DROP VIEW v_college_rollup;

CREATE VIEW v_college_rollup AS
SELECT c.id, c.name, c.city_id,
       COUNT(cs.id)                                              AS total_streams,
       COUNT(*) FILTER (WHERE cs.is_active)                      AS active_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'CONFIRMED')            AS confirmed_streams,
       COUNT(*) FILTER (WHERE cs.stage = 'COMPLETED')            AS completed_streams,
       COALESCE(bool_or(cs.stage <> 'IDENTIFIED'), FALSE)        AS is_activated
FROM colleges c
LEFT JOIN college_streams cs ON cs.college_id = c.id
GROUP BY c.id;

ALTER TABLE colleges
    DROP COLUMN address,
    DROP COLUMN website,
    DROP COLUMN notes,
    DROP COLUMN engagement_scope,
    DROP COLUMN is_paid_partner;

DROP TYPE engagement_scope;
