import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";

/**
 * Adds a new player to a team's roster.
 * Body: { teamId, name }
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Zadej jméno hráče." }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: { teamId, name },
  });

  return NextResponse.json({ ok: true, player });
}
