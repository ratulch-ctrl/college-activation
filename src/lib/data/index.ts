// ============================================================================
// Backend selector. Screens import `db` from here and never care which
// concrete backend is behind it.
//
// V0 ships the in-memory mock. When Supabase env vars are present a supabase-js
// backend will be selected here instead — the swap is one line, because every
// screen already talks to the DataBackend interface.
// ============================================================================

import type { DataBackend } from '@/lib/data/backend';
import { mockBackend } from '@/lib/data/mock/mockBackend';

// Later:
//   import { supabaseBackend } from '@/lib/data/supabase/supabaseBackend';
//   export const db: DataBackend = isSupabaseConfigured() ? supabaseBackend : mockBackend;
export const db: DataBackend = mockBackend;

export type { DataBackend };
