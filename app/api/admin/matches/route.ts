import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";

/**
 * Creates a new fixture (Match) for a team. Only an admin of that team
 * (or a superadmin) may do this - checked server-side, not just in the UI.
 * Body: { teamId, round, opponent, venue: "HOME"|"AWAY", kickoffAt (ISO) }
 */
export async function POST(req: Request) {
  const session = await getCurrentSession();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }

  const teamId = Number(body.teamId);
  if (!canAdministerTeam(session, teamId)) {
    return NextResponse.json(
      { error: "Nemáš oprávnění správcovat tento tým." },
      { status: 403 }
    );
  }

  const round = Number(body.round);
  const opponent = typeof body.opponent === "string" ? body.opponent.trim() : "";
  const venue = body.venue === "HOME" || body.venue === "AWAY" ? body.venue : null;
  const kickoffAt = body.kickoffAt ? new Date(body.kickoffAt) : null;

  if (
    !Number.isInteger(round) ||
    !opponent ||
    !venue ||
    !kickoffAt ||
    Number.isNaN(kickoffAt.getTime())
  ) {
    return NextResponse.json(
      { error: "Vyplň všechna pole zápasu správně." },
      { status: 400 }
    );
  }

  const match = await prisma.match.create({
    data: { teamId, round, opponent, venue, kickoffAt },
  });

  return NextResponse.json({ ok: true, match });
}
