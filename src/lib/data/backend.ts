// ============================================================================
// The data layer contract. All screens talk to this interface, never to a
// concrete backend. V0 ships an in-memory mock; a supabase-js implementation
// drops in later (see CLAUDE.md: "keep storage access behind a thin data
// layer so the backend is swappable").
// ============================================================================

import type {
  Branch,
  City,
  College,
  CollegeCompetitor,
  CollegeContact,
  CollegeStream,
  Interaction,
  StageFieldRequirement,
  StreamStage,
  TeamMember,
} from '@/lib/types';

// ---- Input shapes (id / timestamps assigned by the backend) ---------------

export type CollegeInput = Omit<College, 'id' | 'created_at' | 'updated_at'>;
export type StreamInput = Omit<
  CollegeStream,
  'id' | 'created_at' | 'updated_at' | 'last_interaction_at'
>;
export type ContactInput = Omit<CollegeContact, 'id'>;
export type CompetitorInput = Omit<CollegeCompetitor, 'id' | 'created_at'>;

export interface InteractionInput {
  college_id: number;
  team_member_id: number;
  interaction_date: string;
  channel: Interaction['channel'];
  all_streams: boolean;
  summary: string;
  outcome?: string | null;
  resulting_stage?: StreamStage | null;
  next_step?: string | null;
  next_action_date?: string | null;
  stream_ids: number[]; // ignored when all_streams = true
  contact_ids: number[];
}

/** A stream enriched with college + owner names, for the board and lists. */
export interface StreamWithContext extends CollegeStream {
  college_name: string;
  owner_bdm_name: string | null;
}

// ---- The contract ---------------------------------------------------------

export interface DataBackend {
  // org / reference
  listCities(): Promise<City[]>;
  listBranches(): Promise<Branch[]>;
  listTeamMembers(): Promise<TeamMember[]>;
  getTeamMemberByEmail(email: string): Promise<TeamMember | null>;

  // colleges
  listColleges(): Promise<College[]>;
  getCollege(id: number): Promise<College | null>;
  createCollege(input: CollegeInput): Promise<College>;
  updateCollege(id: number, patch: Partial<CollegeInput>): Promise<College>;
  deleteCollege(id: number): Promise<void>;

  // streams
  listStreams(collegeId?: number): Promise<CollegeStream[]>;
  listStreamsWithContext(): Promise<StreamWithContext[]>;
  getStream(id: number): Promise<CollegeStream | null>;
  createStream(input: StreamInput): Promise<CollegeStream>;
  updateStream(id: number, patch: Partial<StreamInput>): Promise<CollegeStream>;
  deleteStream(id: number): Promise<void>;

  // contacts
  listContacts(collegeId?: number): Promise<CollegeContact[]>;
  createContact(input: ContactInput): Promise<CollegeContact>;
  updateContact(id: number, patch: Partial<ContactInput>): Promise<CollegeContact>;
  deleteContact(id: number): Promise<void>;

  // competitors
  listCompetitors(collegeId?: number): Promise<CollegeCompetitor[]>;
  createCompetitor(input: CompetitorInput): Promise<CollegeCompetitor>;
  deleteCompetitor(id: number): Promise<void>;

  // interactions (advances stream stage as a side effect)
  listInteractions(collegeId?: number): Promise<Interaction[]>;
  createInteraction(input: InteractionInput): Promise<Interaction>;

  // stage-driven forms
  listStageFieldRequirements(stage?: StreamStage): Promise<StageFieldRequirement[]>;

  // "my follow-ups due": streams owned by a member with next_action_date <= onOrBefore
  followUpsDue(teamMemberId: number, onOrBefore: string): Promise<StreamWithContext[]>;
}
