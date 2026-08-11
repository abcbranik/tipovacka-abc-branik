import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";

/**
 * Edits a fixture's details (opponent, venue, kickoffAt, round).
 * Editing the result (score / scorers) is handled by the /result sub-route.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  const matchId = Number(params.id);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Zápas neexistuje." }, { status: 404 });
  }
  if (!canAdministerTeam(session, match.teamId)) {
    return NextResponse.json(
      { error: "Nemáš oprávnění správcovat tento tým." },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.round !== undefined) data.round = Number(body.round);
  if (body.opponent !== undefined) data.opponent = String(body.opponent).trim();
  if (body.venue === "HOME" || body.venue === "AWAY") data.venue = body.venue;
  if (body.kickoffAt !== undefined) {
    const d = new Date(body.kickoffAt);
    if (!Number.isNaN(d.getTime())) data.kickoffAt = d;
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data,
  });

  return NextResponse.json({ ok: true, match: updated });
}
