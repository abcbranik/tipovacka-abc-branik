import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";

/**
 * Adds one or more new players to a team's roster.
 * Body: { teamId, name } for a single player, or { teamId, names: string[] }
 * to add many at once (e.g. pasted from a roster list, one name per line).
 * Bulk mode skips names that are blank or already exist on the team
 * (case-insensitive) rather than failing the whole request.
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

  if (Array.isArray(body.names)) {
    const requestedNames = Array.from(
      new Set(
        body.names
          .map((n: unknown) => (typeof n === "string" ? n.trim() : ""))
          .filter((n: string) => n.length > 0)
      )
    ) as string[];

    if (requestedNames.length === 0) {
      return NextResponse.json(
        { error: "Zadej aspoň jedno jméno hráče." },
        { status: 400 }
      );
    }

    const existing = await prisma.player.findMany({ where: { teamId } });
    const existingLower = new Set(existing.map((p) => p.name.toLowerCase()));

    const toCreate = requestedNames.filter(
      (n) => !existingLower.has(n.toLowerCase())
    );
    const skipped = requestedNames.filter((n) =>
      existingLower.has(n.toLowerCase())
    );

    if (toCreate.length > 0) {
      await prisma.player.createMany({
        data: toCreate.map((name) => ({ teamId, name })),
      });
    }

    return NextResponse.json({ ok: true, created: toCreate, skipped });
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
