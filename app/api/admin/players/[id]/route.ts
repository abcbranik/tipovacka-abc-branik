import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";

/**
 * Toggles a player's active status (deactivate instead of delete, so
 * historical tips/scorers referencing the player remain intact).
 * Body: { active: boolean }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  const playerId = Number(params.id);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Hráč neexistuje." }, { status: 404 });
  }
  if (!canAdministerTeam(session, player.teamId)) {
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

  const active = Boolean(body.active);

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { active },
  });

  return NextResponse.json({ ok: true, player: updated });
}

/**
 * Permanently deletes a player. Only allowed for already-deactivated
 * players, and only if they have no recorded goals in a finished match
 * (deleting would otherwise silently erase that match's scorer history).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  const playerId = Number(params.id);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Hráč neexistuje." }, { status: 404 });
  }
  if (!canAdministerTeam(session, player.teamId)) {
    return NextResponse.json(
      { error: "Nemáš oprávnění správcovat tento tým." },
      { status: 403 }
    );
  }
  if (player.active) {
    return NextResponse.json(
      { error: "Hráče lze smazat až po deaktivaci." },
      { status: 400 }
    );
  }

  const scorerCount = await prisma.matchScorer.count({ where: { playerId } });
  if (scorerCount > 0) {
    return NextResponse.json(
      {
        error:
          "Tohoto hráče nelze smazat, protože je u něj zaznamenaný gól v odehraném zápase – smazáním by se ztratila historie střelců.",
      },
      { status: 400 }
    );
  }

  await prisma.player.delete({ where: { id: playerId } });

  return NextResponse.json({ ok: true });
}
