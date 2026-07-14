'use server';

// ============================================================================
// Auth server actions (MOCK backend for V0).
//
// In mock mode any seeded team-member email signs in with any non-empty
// password — the login screen lists the seeded emails so a reviewer can get in
// on a preview with zero setup. When the Supabase backend lands this file is
// replaced by real email+password auth (supabase.auth.signInWithPassword),
// while the rest of the app keeps calling getCurrentUser()/useAuth() unchanged.
// ============================================================================

import { cookies } from 'next/headers';
import { db } from '@/lib/data';
import { SESSION_COOKIE } from '@/lib/auth/session';
import type { TeamMember } from '@/lib/types';

export type SignInResult =
  | { ok: true; user: TeamMember }
  | { ok: false; error: string };

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    return { ok: false, error: 'Enter an email and password.' };
  }
  const user = await db.getTeamMemberByEmail(trimmed);
  if (!user) {
    return { ok: false, error: 'No team member found with that email.' };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true, user };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
