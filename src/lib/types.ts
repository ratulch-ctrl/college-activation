// ============================================================================
// App-side mirror of the DB enums and row shapes.
// Enums MUST match schema.sql exactly (values are the source of truth).
// See schema.sql / supabase/migrations/0001_init_schema.sql.
// ============================================================================

// ---------- Enums (mirror DB CREATE TYPE ... AS ENUM) ----------------------

export const TEAM_ROLES = [
  'MANAGER',
  'BDM',
  'BRANCH_EXECUTIVE',
  'COUNSELOR',
  'EC',
  'VP',
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const COLLEGE_CATEGORIES = [
  'ENGINEERING',
  'DEGREE',
  'MANAGEMENT',
  'UNIVERSITY',
  'OTHER',
] as const;
export type CollegeCategory = (typeof COLLEGE_CATEGORIES)[number];

export const INTERNAL_PRIORITY_TIERS = ['A', 'B', 'C'] as const;
export type InternalPriorityTier = (typeof INTERNAL_PRIORITY_TIERS)[number];

export const COMPETITOR_STRENGTHS = ['STRONG', 'MODERATE', 'WEAK'] as const;
export type CompetitorStrength = (typeof COMPETITOR_STRENGTHS)[number];

export const STREAM_STAGES = [
  'IDENTIFIED',
  'CONTACTED',
  'IN_DISCUSSION',
  'AGREED',
  'CONFIRMED',
  'COMPLETED',
  'DORMANT',
  'REJECTED',
] as const;
export type StreamStage = (typeof STREAM_STAGES)[number];

/** The ordered "happy path" pipeline stages (excludes DORMANT / REJECTED). */
export const PIPELINE_STAGES: StreamStage[] = [
  'IDENTIFIED',
  'CONTACTED',
  'IN_DISCUSSION',
  'AGREED',
  'CONFIRMED',
  'COMPLETED',
];

export const CONTACT_ROLES = [
  'TPO',
  'HOD',
  'PRINCIPAL',
  'PLACEMENT_COORDINATOR',
  'FACULTY',
  'OTHER',
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const INTERACTION_CHANNELS = [
  'VISIT',
  'CALL',
  'EMAIL',
  'WHATSAPP',
  'OTHER',
] as const;
export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];

export const ACTIVITY_TYPES = [
  'SEMINAR',
  'MOCK_TEST',
  'EDUCATION_FAIR',
  'FLYER_DISTRIBUTION',
  'HELP_DESK',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const REQUIREMENT_SCOPES = ['STREAM', 'EVENT'] as const;
export type RequirementScope = (typeof REQUIREMENT_SCOPES)[number];

// ---------- Row shapes (mirror the tables used in V0) ----------------------
// Only the columns V0 touches are typed here; more get added as we build.

export interface City {
  id: number;
  name: string;
  state: string | null;
}

export interface Branch {
  id: number;
  name: string;
  city_id: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: TeamRole;
  email: string | null;
  phone: string | null;
  city_id: number | null;
  branch_id: number | null;
  manager_id: number | null;
  is_active: boolean;
}

export interface College {
  id: number;
  name: string;
  city_id: number;
  category: CollegeCategory;
  owner_bdm_id: number | null;
  google_maps_link: string | null;
  affiliation: string | null;
  accreditation: string | null;
  internal_priority_tier: InternalPriorityTier | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeCompetitor {
  id: number;
  college_id: number;
  competitor_name: string;
  strength: CompetitorStrength | null;
  active_since: string | null; // ISO date
  notes: string | null;
  created_at: string;
}

export interface CollegeStream {
  id: number;
  college_id: number;
  stream_name: string;
  department: string | null;
  stage: StreamStage;
  is_active: boolean;
  final_year_strength: number | null;
  pre_final_year_strength: number | null;
  owner_bdm_id: number | null;
  primary_contact_id: number | null;
  current_next_step: string | null;
  next_action_date: string | null; // ISO date (YYYY-MM-DD)
  last_interaction_at: string | null; // ISO timestamp
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeContact {
  id: number;
  college_id: number;
  college_stream_id: number | null;
  name: string;
  role: ContactRole;
  department: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
}

export interface Interaction {
  id: number;
  college_id: number;
  team_member_id: number;
  interaction_date: string; // ISO date
  channel: InteractionChannel;
  all_streams: boolean;
  summary: string;
  outcome: string | null;
  resulting_stage: StreamStage | null;
  next_step: string | null;
  next_action_date: string | null;
  created_at: string;
  // join helpers (not columns): stream + contact ids touched
  stream_ids?: number[];
  contact_ids?: number[];
}

export interface StageFieldRequirement {
  id: number;
  stage: StreamStage;
  applies_to: RequirementScope;
  field_key: string;
  field_label: string;
  is_required: boolean;
  sort_order: number;
}

// ---------- Display helpers -------------------------------------------------

/** Human-friendly label for an enum-ish UPPER_SNAKE value. */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
