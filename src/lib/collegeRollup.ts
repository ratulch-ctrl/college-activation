// ============================================================================
// Client-agnostic rollup math for the colleges list: total intake and
// "calculated stage" are derived from a college's streams rather than stored,
// same principle as v_college_rollup.is_activated in the DB. The real rollup
// rule for calculated stage is still TBD (per the college-page brainstorm) —
// this is the agreed interim: furthest PIPELINE_STAGES stage reached by any
// of the college's streams, DORMANT/REJECTED excluded from the comparison.
// ============================================================================

import { PIPELINE_STAGES, type CollegeStream, type StreamStage } from '@/lib/types';

export function totalStudentsForCollege(
  streams: CollegeStream[],
  collegeId: number,
): number {
  return streams
    .filter((s) => s.college_id === collegeId)
    .reduce((sum, s) => sum + (s.final_year_strength ?? 0), 0);
}

export function calculatedStageForCollege(
  streams: CollegeStream[],
  collegeId: number,
): StreamStage | null {
  let best: StreamStage | null = null;
  let bestIndex = -1;
  for (const s of streams) {
    if (s.college_id !== collegeId) continue;
    const idx = PIPELINE_STAGES.indexOf(s.stage);
    if (idx === -1) continue; // DORMANT / REJECTED excluded from comparison
    if (idx > bestIndex) {
      bestIndex = idx;
      best = s.stage;
    }
  }
  return best;
}

/** Sort index for a stage restricted to PIPELINE_STAGES; nulls/others sort last. */
export function stageSortIndex(stage: StreamStage | null): number {
  if (stage == null) return PIPELINE_STAGES.length + 1;
  const idx = PIPELINE_STAGES.indexOf(stage);
  return idx === -1 ? PIPELINE_STAGES.length : idx;
}
