import { prisma } from "@/lib/prisma";
import {
  computeResultPoints,
  computeScorerPointsForMatch,
  computeTotalPoints,
} from "@/lib/scoring";

/**
 * Recomputes resultPoints, scorerPoints and totalPoints for every existing
 * Tip on the given match, based on the match's current (real) result and
 * MatchScorer rows. Idempotent - safe to call again whenever the admin
 * edits a result. Wrapped in a single Prisma transaction so tips are never
 * left in a partially-updated state.
 */
export async function recomputePointsForMatch(matchId: number): Promise<void> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.ourScore === null || match.opponentScore === null) return;

  const [tips, matchScorers] = await Promise.all([
    prisma.tip.findMany({ where: { matchId } }),
    prisma.matchScorer.findMany({ where: { matchId } }),
  ]);

  const realScorerPlayerIds = matchScorers.map((s) => s.playerId);
  const scorerPointsMap = computeScorerPointsForMatch(
    tips.map((t) => ({ id: t.id, predictedPlayerId: t.predictedPlayerId })),
    realScorerPlayerIds
  );

  await prisma.$transaction(
    tips.map((tip) => {
      const resultPoints = computeResultPoints(
        tip.predOurScore,
        tip.predOpponentScore,
        match.ourScore as number,
        match.opponentScore as number
      );
      const scorerPoints = scorerPointsMap.get(tip.id) ?? 0;
      const totalPoints = computeTotalPoints(resultPoints, scorerPoints);

      return prisma.tip.update({
        where: { id: tip.id },
        data: { resultPoints, scorerPoints, totalPoints },
      });
    })
  );
}
