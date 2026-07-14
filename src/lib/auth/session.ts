// ============================================================================
// Server-side session helpers. The signed-in team member's id lives in a
// cookie so Server Components can resolve "who is logged in" — the same shape
// Supabase SSR auth will use later, so screens don't change on the swap.
// ============================================================================

import { cookies } from 'next/headers';
import { db } from '@/lib/data';
import type { TeamMember } from '@/lib/types';

export const SESSION_COOKIE = 'btl_uid';

/** Resolve the currently signed-in team member from the session cookie. */
export async function getCurrentUser(): Promise<TeamMember | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  const members = await db.listTeamMembers();
  return members.find((m) => m.id === id) ?? null;
}
