// ============================================================================
// In-memory implementation of DataBackend. Module-level singleton store, so
// mutations persist across requests within a single warm server process.
// (Serverless may reset between cold starts — fine for a preview; real
// persistence arrives with the Supabase backend.)
// ============================================================================

import type {
  Branch,
  City,
  College,
  CollegeContact,
  CollegeStream,
  Interaction,
  StageFieldRequirement,
  StreamStage,
  TeamMember,
} from '@/lib/types';
import type {
  CollegeInput,
  ContactInput,
  DataBackend,
  InteractionInput,
  StreamInput,
  StreamWithContext,
} from '@/lib/data/backend';
import {
  seedBranches,
  seedCities,
  seedColleges,
  seedContacts,
  seedInteractions,
  seedStageFieldRequirements,
  seedStreams,
  seedTeamMembers,
} from '@/lib/data/mock/seed';

interface Store {
  cities: City[];
  branches: Branch[];
  teamMembers: TeamMember[];
  colleges: College[];
  streams: CollegeStream[];
  contacts: CollegeContact[];
  interactions: Interaction[];
  stageFieldRequirements: StageFieldRequirement[];
  seq: number; // next id
}

// Persist the store across HMR / module reloads in dev via globalThis.
const g = globalThis as unknown as { __btlMockStore?: Store };

function freshStore(): Store {
  return {
    cities: structuredClone(seedCities),
    branches: structuredClone(seedBranches),
    teamMembers: structuredClone(seedTeamMembers),
    colleges: structuredClone(seedColleges),
    streams: structuredClone(seedStreams),
    contacts: structuredClone(seedContacts),
    interactions: structuredClone(seedInteractions),
    stageFieldRequirements: structuredClone(seedStageFieldRequirements),
    seq: 1000,
  };
}

function store(): Store {
  if (!g.__btlMockStore) g.__btlMockStore = freshStore();
  return g.__btlMockStore;
}

const clone = <T>(v: T): T => structuredClone(v);
const nowIso = () => new Date().toISOString();

function ownerName(s: Store, ownerId: number | null): string | null {
  if (ownerId == null) return null;
  return s.teamMembers.find((m) => m.id === ownerId)?.name ?? null;
}

function withContext(s: Store, stream: CollegeStream): StreamWithContext {
  return {
    ...clone(stream),
    college_name: s.colleges.find((c) => c.id === stream.college_id)?.name ?? '—',
    owner_bdm_name: ownerName(s, stream.owner_bdm_id),
  };
}

export const mockBackend: DataBackend = {
  // ---- org / reference ----------------------------------------------------
  async listCities() {
    return clone(store().cities);
  },
  async listBranches() {
    return clone(store().branches);
  },
  async listTeamMembers() {
    return clone(store().teamMembers);
  },
  async getTeamMemberByEmail(email) {
    const m = store().teamMembers.find(
      (t) => t.email?.toLowerCase() === email.toLowerCase(),
    );
    return m ? clone(m) : null;
  },

  // ---- colleges -----------------------------------------------------------
  async listColleges() {
    return clone(store().colleges).sort((a, b) => a.name.localeCompare(b.name));
  },
  async getCollege(id) {
    const c = store().colleges.find((x) => x.id === id);
    return c ? clone(c) : null;
  },
  async createCollege(input: CollegeInput) {
    const s = store();
    const row: College = {
      ...input,
      id: s.seq++,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    s.colleges.push(row);
    return clone(row);
  },
  async updateCollege(id, patch) {
    const s = store();
    const row = s.colleges.find((x) => x.id === id);
    if (!row) throw new Error(`College ${id} not found`);
    Object.assign(row, patch, { updated_at: nowIso() });
    return clone(row);
  },
  async deleteCollege(id) {
    const s = store();
    s.colleges = s.colleges.filter((x) => x.id !== id);
    // cascade like the DB (ON DELETE CASCADE)
    const streamIds = s.streams.filter((x) => x.college_id === id).map((x) => x.id);
    s.streams = s.streams.filter((x) => x.college_id !== id);
    s.contacts = s.contacts.filter((x) => x.college_id !== id);
    s.interactions = s.interactions.filter((x) => x.college_id !== id);
    void streamIds;
  },

  // ---- streams ------------------------------------------------------------
  async listStreams(collegeId) {
    const rows = store().streams.filter(
      (x) => collegeId == null || x.college_id === collegeId,
    );
    return clone(rows);
  },
  async listStreamsWithContext() {
    const s = store();
    return s.streams.map((st) => withContext(s, st));
  },
  async getStream(id) {
    const st = store().streams.find((x) => x.id === id);
    return st ? clone(st) : null;
  },
  async createStream(input: StreamInput) {
    const s = store();
    const row: CollegeStream = {
      ...input,
      id: s.seq++,
      last_interaction_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    s.streams.push(row);
    return clone(row);
  },
  async updateStream(id, patch) {
    const s = store();
    const row = s.streams.find((x) => x.id === id);
    if (!row) throw new Error(`Stream ${id} not found`);
    Object.assign(row, patch, { updated_at: nowIso() });
    return clone(row);
  },
  async deleteStream(id) {
    const s = store();
    s.streams = s.streams.filter((x) => x.id !== id);
  },

  // ---- contacts -----------------------------------------------------------
  async listContacts(collegeId) {
    const rows = store().contacts.filter(
      (x) => collegeId == null || x.college_id === collegeId,
    );
    return clone(rows);
  },
  async createContact(input: ContactInput) {
    const s = store();
    const row: CollegeContact = { ...input, id: s.seq++ };
    s.contacts.push(row);
    return clone(row);
  },
  async updateContact(id, patch) {
    const s = store();
    const row = s.contacts.find((x) => x.id === id);
    if (!row) throw new Error(`Contact ${id} not found`);
    Object.assign(row, patch);
    return clone(row);
  },
  async deleteContact(id) {
    const s = store();
    s.contacts = s.contacts.filter((x) => x.id !== id);
  },

  // ---- interactions -------------------------------------------------------
  async listInteractions(collegeId) {
    const rows = store()
      .interactions.filter((x) => collegeId == null || x.college_id === collegeId)
      .sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));
    return clone(rows);
  },
  async createInteraction(input: InteractionInput) {
    const s = store();
    const row: Interaction = {
      id: s.seq++,
      college_id: input.college_id,
      team_member_id: input.team_member_id,
      interaction_date: input.interaction_date,
      channel: input.channel,
      all_streams: input.all_streams,
      summary: input.summary,
      outcome: input.outcome ?? null,
      resulting_stage: input.resulting_stage ?? null,
      next_step: input.next_step ?? null,
      next_action_date: input.next_action_date ?? null,
      created_at: nowIso(),
      stream_ids: input.all_streams ? [] : [...input.stream_ids],
      contact_ids: [...input.contact_ids],
    };
    s.interactions.push(row);

    // Side effect: advance the tagged stream(s), mirroring how the interaction
    // log drives the pipeline (BTL-CRM-Framework §2).
    const targetIds = input.all_streams
      ? s.streams.filter((x) => x.college_id === input.college_id).map((x) => x.id)
      : input.stream_ids;

    for (const sid of targetIds) {
      const st = s.streams.find((x) => x.id === sid);
      if (!st) continue;
      if (input.resulting_stage) st.stage = input.resulting_stage;
      if (input.next_step !== undefined && input.next_step !== null)
        st.current_next_step = input.next_step;
      if (input.next_action_date !== undefined)
        st.next_action_date = input.next_action_date ?? null;
      st.last_interaction_at = row.created_at;
      st.updated_at = nowIso();
    }
    return clone(row);
  },

  // ---- stage-driven forms -------------------------------------------------
  async listStageFieldRequirements(stage?: StreamStage) {
    const rows = store()
      .stageFieldRequirements.filter((x) => stage == null || x.stage === stage)
      .sort((a, b) => a.sort_order - b.sort_order);
    return clone(rows);
  },

  // ---- follow-ups due -----------------------------------------------------
  async followUpsDue(teamMemberId, onOrBefore) {
    const s = store();
    return s.streams
      .filter(
        (st) =>
          st.owner_bdm_id === teamMemberId &&
          st.is_active &&
          st.next_action_date != null &&
          st.next_action_date <= onOrBefore,
      )
      .sort((a, b) => (a.next_action_date ?? '').localeCompare(b.next_action_date ?? ''))
      .map((st) => withContext(s, st));
  },
};
