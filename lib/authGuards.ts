import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/** Fetches the current server-side session, or null if not logged in. */
export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Returns true if the session's user may administer the given team:
 * SUPERADMIN can administer any team; ADMIN only teams listed in their
 * teamIds; MEMBER can never administer any team.
 */
export function canAdministerTeam(
  session: Session | null,
  teamId: number
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "SUPERADMIN") return true;
  if (session.user.role === "ADMIN") {
    return session.user.teamIds.includes(teamId);
  }
  return false;
}

/** True if the session's user is a SUPERADMIN. */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === "SUPERADMIN";
}

/** True if the session's user is an ADMIN or SUPERADMIN (manages >=1 team, or all). */
export function isAnyAdmin(session: Session | null): boolean {
  return (
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN"
  );
}
