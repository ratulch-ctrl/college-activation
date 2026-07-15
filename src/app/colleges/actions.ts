'use server';

// ============================================================================
// Server actions for the colleges page: add/edit college, add stream, and
// manage competitor intel. Thin wrappers over `db` (the swappable data layer)
// — screens never call the backend directly.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/data';
import type {
  CollegeCategory,
  InternalPriorityTier,
  CompetitorStrength,
} from '@/lib/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

// ---- Colleges ---------------------------------------------------------------

export interface CreateCollegeFields {
  name: string;
  city_id: number;
  internal_priority_tier: InternalPriorityTier;
  google_maps_link: string;
}

export async function createCollegeAction(
  fields: CreateCollegeFields,
): Promise<ActionResult> {
  const name = fields.name.trim();
  const googleMapsLink = fields.google_maps_link.trim();
  if (!name) return { ok: false, error: 'College name is required.' };
  if (!fields.city_id) return { ok: false, error: 'City is required.' };
  if (!fields.internal_priority_tier) {
    return { ok: false, error: 'Internal priority tier is required.' };
  }
  if (!googleMapsLink) return { ok: false, error: 'Google Maps link is required.' };

  await db.createCollege({
    name,
    city_id: fields.city_id,
    category: 'OTHER',
    owner_bdm_id: null,
    google_maps_link: googleMapsLink,
    affiliation: null,
    accreditation: null,
    internal_priority_tier: fields.internal_priority_tier,
  });
  revalidatePath('/colleges');
  return { ok: true };
}

export interface EditCollegeFields {
  name: string;
  city_id: number;
  category: CollegeCategory;
  owner_bdm_id: number | null;
  google_maps_link: string;
  affiliation: string;
  accreditation: string;
  internal_priority_tier: InternalPriorityTier | null;
}

export async function updateCollegeAction(
  id: number,
  fields: EditCollegeFields,
): Promise<ActionResult> {
  const name = fields.name.trim();
  if (!name) return { ok: false, error: 'College name is required.' };
  if (!fields.city_id) return { ok: false, error: 'City is required.' };

  await db.updateCollege(id, {
    name,
    city_id: fields.city_id,
    category: fields.category,
    owner_bdm_id: fields.owner_bdm_id,
    google_maps_link: fields.google_maps_link.trim() || null,
    affiliation: fields.affiliation.trim() || null,
    accreditation: fields.accreditation.trim() || null,
    internal_priority_tier: fields.internal_priority_tier,
  });
  revalidatePath('/colleges');
  return { ok: true };
}

// ---- Streams ------------------------------------------------------------

export interface CreateStreamFields {
  college_id: number;
  stream_name: string;
  department: string;
  final_year_strength: number;
}

export async function createStreamAction(
  fields: CreateStreamFields,
): Promise<ActionResult> {
  const streamName = fields.stream_name.trim();
  const department = fields.department.trim();
  if (!streamName) return { ok: false, error: 'Stream name is required.' };
  if (!department) return { ok: false, error: 'Department is required.' };
  if (!Number.isFinite(fields.final_year_strength) || fields.final_year_strength < 0) {
    return { ok: false, error: 'Total students per intake must be a non-negative number.' };
  }

  // Streams are implicitly owned by whoever owns the college (per the
  // college-page brainstorm: "the BDM who owns the college owns all the
  // streams from that college").
  const college = await db.getCollege(fields.college_id);
  if (!college) return { ok: false, error: 'College not found.' };

  await db.createStream({
    college_id: fields.college_id,
    stream_name: streamName,
    department,
    stage: 'IDENTIFIED',
    is_active: true,
    final_year_strength: fields.final_year_strength,
    pre_final_year_strength: null,
    owner_bdm_id: college.owner_bdm_id,
    primary_contact_id: null,
    current_next_step: null,
    next_action_date: null,
    notes: null,
  });
  revalidatePath('/colleges');
  return { ok: true };
}

// ---- Competitor intel -----------------------------------------------------

export interface AddCompetitorFields {
  college_id: number;
  competitor_name: string;
  strength: CompetitorStrength | null;
  active_since: string | null;
}

export async function addCompetitorAction(
  fields: AddCompetitorFields,
): Promise<ActionResult> {
  const competitorName = fields.competitor_name.trim();
  if (!competitorName) return { ok: false, error: 'Competitor name is required.' };

  await db.createCompetitor({
    college_id: fields.college_id,
    competitor_name: competitorName,
    strength: fields.strength,
    active_since: fields.active_since || null,
    notes: null,
  });
  revalidatePath('/colleges');
  return { ok: true };
}

export async function deleteCompetitorAction(id: number): Promise<ActionResult> {
  await db.deleteCompetitor(id);
  revalidatePath('/colleges');
  return { ok: true };
}
