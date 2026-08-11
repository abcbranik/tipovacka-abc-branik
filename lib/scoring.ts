/**
 * Scoring logic for the tipovačka (prediction pool).
 *
 * These are pure functions with no I/O so they can be unit-tested in
 * isolation and reasoned about without touching the database.
 *
 * ---------------------------------------------------------------------------
 * RESULT POINTS (computeResultPoints)
 * ---------------------------------------------------------------------------
 * Only the single BEST matching tier applies (tiers are not cumulative):
 *   - Exact score match                          -> 5 points
 *   - Goal difference matches (but not the score) -> 3 points
 *   - Outcome matches (win/draw/loss), but not the -> 1 point
 *     difference or the exact score
 *   - Nothing matches                             -> 0 points
 *
 * ---------------------------------------------------------------------------
 * SCORER POINTS (computeScorerPointsForMatch) - "popularity discount"
 * ---------------------------------------------------------------------------
 * Rationale: if everybody predicts the club's top scorer, that pick carries
 * little "information value" - it was an easy, safe guess. Someone who
 * predicts a rarely-picked player (or correctly predicts "no goal by us")
 * took a bigger risk, so a correct rare pick should be worth more than a
 * correct popular pick. At the same time every correct pick should still be
 * rewarded with at least a small baseline amount, so the mechanic doesn't
 * punish people for agreeing with the crowd when the crowd is simply right.
 *
 * Algorithm per match:
 *   1. Look at all tips for the match that contain a scorer prediction
 *      (predictedPlayerId is either a real player id, or null which is
 *      itself a valid pick meaning "nobody from our team scores").
 *   2. Group tips by their exact pick value (a playerId, or the "null"
 *      bucket) and compute how popular each pick was:
 *        popularityShare = pickCount / totalTipsWithScorerPick
 *   3. A pick is "correct" if:
 *        - the match had zero real scorers and the pick was null, OR
 *        - the match had at least one real scorer and the picked player is
 *          among the real scorers (MatchScorer rows).
 *   4. Incorrect picks -> 0 scorer points.
 *   5. Correct picks -> base 2 points, plus a rarity bonus of up to +3 for
 *      picks nobody else made, i.e.:
 *        bonus  = round(3 * (1 - popularityShare))
 *        points = clamp(2 + bonus, 2, 5)
 *      So a correct pick is always worth between 2 and 5 points: an almost
 *      universally-picked correct scorer earns close to 2, while a correct
 *      pick that (almost) nobody else made earns close to 5.
 */

/** A minimal shape of a Tip needed to compute scorer points. */
export interface ScorerTipInput {
  id: number;
  predictedPlayerId: number | null;
}

/**
 * Computes "result points" (points for predicting the score / outcome)
 * for a single tip, given the real final score.
 *
 * Only the highest-matching tier is awarded (tiers are NOT cumulative).
 */
export function computeResultPoints(
  predOurScore: number,
  predOpponentScore: number,
  ourScore: number,
  opponentScore: number
): number {
  const exactMatch =
    predOurScore === ourScore && predOpponentScore === opponentScore;
  if (exactMatch) return 5;

  const predDiff = predOurScore - predOpponentScore;
  const realDiff = ourScore - opponentScore;
  if (predDiff === realDiff) return 3;

  const predOutcome = Math.sign(predDiff); // 1 = win, 0 = draw, -1 = loss
  const realOutcome = Math.sign(realDiff);
  if (predOutcome === realOutcome) return 1;

  return 0;
}

/** Clamp a number between [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A sentinel key used internally to represent the "no scorer" bucket
 * (predictedPlayerId === null) in the popularity map, since a plain `null`
 * cannot be used as a Map key alongside numbers in a type-safe way.
 */
const NO_SCORER_KEY = "NO_SCORER";

/**
 * Computes scorer points for every tip on a single match, applying the
 * "popularity discount" described above.
 *
 * @param tips - all tips for the match that include a scorer prediction
 *   (predictedPlayerId may be a player id or null - both are valid picks).
 * @param realScorerPlayerIds - the ids of players who actually scored for
 *   our team in this match, per admin-entered MatchScorer rows. An empty
 *   array means nobody from our team scored.
 * @returns a Map from tip id to the scorer points earned (0, or 2-5).
 */
export function computeScorerPointsForMatch(
  tips: ScorerTipInput[],
  realScorerPlayerIds: number[]
): Map<number, number> {
  const result = new Map<number, number>();
  const total = tips.length;

  if (total === 0) {
    return result;
  }

  // Count how many tips picked each distinct value (player id or "no scorer").
  const pickCounts = new Map<number | typeof NO_SCORER_KEY, number>();
  for (const tip of tips) {
    const key = tip.predictedPlayerId ?? NO_SCORER_KEY;
    pickCounts.set(key, (pickCounts.get(key) ?? 0) + 1);
  }

  const realScorerSet = new Set(realScorerPlayerIds);
  const noOneScored = realScorerSet.size === 0;

  for (const tip of tips) {
    const key = tip.predictedPlayerId ?? NO_SCORER_KEY;
    const pickCount = pickCounts.get(key) ?? 0;
    const popularityShare = pickCount / total;

    const isCorrect =
      tip.predictedPlayerId === null
        ? noOneScored
        : realScorerSet.has(tip.predictedPlayerId);

    if (!isCorrect) {
      result.set(tip.id, 0);
      continue;
    }

    const bonus = Math.round(3 * (1 - popularityShare));
    const points = clamp(2 + bonus, 2, 5);
    result.set(tip.id, points);
  }

  return result;
}

/** Sums result + scorer points into the total for a tip. */
export function computeTotalPoints(
  resultPoints: number,
  scorerPoints: number
): number {
  return resultPoints + scorerPoints;
}
