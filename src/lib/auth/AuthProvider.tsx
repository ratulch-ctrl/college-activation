'use client';

// Client-side view of the current user, seeded from the server so the nav can
// show who's logged in and offer sign-out. Auth gating itself is enforced in
// middleware.ts (server-side), not here.

import { createContext, useContext } from 'react';
import type { TeamMember } from '@/lib/types';

const AuthContext = createContext<TeamMember | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: TeamMember | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

/** The signed-in team member, or null if not signed in. */
export function useCurrentUser(): TeamMember | null {
  return useContext(AuthContext);
}
