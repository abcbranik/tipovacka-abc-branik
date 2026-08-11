import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, canAdministerTeam } from "@/lib/authGuards";
import { recomputePointsForMatch } from "@/lib/recompute";

/**
 * Enters or edits the real result for a match: final score plus which
 * players scored for our team. Sets status to FINISHED and triggers
 * recomputation of every tip's points for this match.
 * Body: { ourScore, opponentScore, scorerPlayerIds: number[] }
 */
export async function POST(
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

  const ourScore = Number(body.ourScore);
  const opponentScore = Number(body.opponentScore);
  const scorerPlayerIds: number[] = Array.isArray(body.scorerPlayerIds)
    ? body.scorerPlayerIds.map((x: unknown) => Number(x)).filter(Number.isInteger)
    : [];

  if (
    !Number.isInteger(ourScore) ||
    !Number.isInteger(opponentScore) ||
    ourScore < 0 ||
    opponentScore < 0
  ) {
    return NextResponse.json(
      { error: "Zadej platné skóre (celá čísla, 0 a víc)." },
      { status: 400 }
    );
  }

  // Sanity check: if our score is 0, there can be no scorers on our side.
  if (ourScore === 0 && scorerPlayerIds.length > 0) {
    return NextResponse.json(
      { error: "Nulové skóre, ale zadaní střelci - zkontroluj výsledek." },
      { status: 400 }
    );
  }

  // Validate that all chosen scorers belong to this match's team.
  if (scorerPlayerIds.length > 0) {
    const players = await prisma.player.findMany({
      where: { id: { in: scorerPlayerIds } },
    });
    const invalid = players.some((p) => p.teamId !== match.teamId);
    if (invalid || players.length !== new Set(scorerPlayerIds).size) {
      return NextResponse.json(
        { error: "Neplatný výběr střelců." },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { ourScore, opponentScore, status: "FINISHED" },
    });

    await tx.matchScorer.deleteMany({ where: { matchId } });
    if (scorerPlayerIds.length > 0) {
      await tx.matchScorer.createMany({
        data: Array.from(new Set(scorerPlayerIds)).map((playerId) => ({
          matchId,
          playerId,
        })),
      });
    }
  });

  await recomputePointsForMatch(matchId);

  return NextResponse.json({ ok: true });
}
