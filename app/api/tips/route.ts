import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/authGuards";

/**
 * Create or update the current user's tip for a match.
 * Body: { matchId, predOurScore, predOpponentScore, predictedPlayerId }
 * predictedPlayerId may be null ("Nikdo z nás nedá gól").
 *
 * Rejects if the match has already started (kickoffAt <= now) or already
 * has a result entered (status === FINISHED).
 */
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Nejsi přihlášen(a)." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }

  const matchId = Number(body.matchId);
  const predOurScore = Number(body.predOurScore);
  const predOpponentScore = Number(body.predOpponentScore);
  const predictedPlayerId =
    body.predictedPlayerId === null || body.predictedPlayerId === undefined
      ? null
      : Number(body.predictedPlayerId);

  if (
    !Number.isInteger(matchId) ||
    !Number.isInteger(predOurScore) ||
    !Number.isInteger(predOpponentScore) ||
    predOurScore < 0 ||
    predOpponentScore < 0
  ) {
    return NextResponse.json(
      { error: "Zadej platné skóre (celá čísla, 0 a víc)." },
      { status: 400 }
    );
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { team: true },
  });
  if (!match) {
    return NextResponse.json({ error: "Zápas neexistuje." }, { status: 404 });
  }

  if (match.status === "FINISHED" || match.kickoffAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Tento zápas už začal nebo skončil, tip už nelze uložit." },
      { status: 400 }
    );
  }

  if (predictedPlayerId !== null) {
    const player = await prisma.player.findUnique({
      where: { id: predictedPlayerId },
    });
    if (!player || player.teamId !== match.teamId) {
      return NextResponse.json(
        { error: "Neplatný hráč pro tento tým." },
        { status: 400 }
      );
    }
  }

  const tip = await prisma.tip.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId,
      },
    },
    update: {
      predOurScore,
      predOpponentScore,
      predictedPlayerId,
    },
    create: {
      userId: session.user.id,
      matchId,
      predOurScore,
      predOpponentScore,
      predictedPlayerId,
    },
  });

  return NextResponse.json({ ok: true, tip });
}
