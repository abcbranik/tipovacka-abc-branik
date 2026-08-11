import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import LeaderboardTable, {
  LeaderboardRow,
} from "@/components/LeaderboardTable";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { round?: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const [users, teams, tips] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: { id: "asc" } }),
    prisma.tip.findMany({
      where: { totalPoints: { not: null } },
      include: { match: true },
    }),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Every distinct round number that has at least one finished, scored
  // match - used to build the "Kolo 1 / Kolo 2 / ..." filter links. Rounds
  // are shared across all 4 team categories (kolo 1 for A muži and kolo 1
  // for A ženy are both "kolo 1" for this purpose).
  const allRounds = Array.from(new Set(tips.map((t) => t.match.round))).sort(
    (a, b) => a - b
  );

  const requestedRound = Number(searchParams.round);
  const selectedRound = allRounds.includes(requestedRound)
    ? requestedRound
    : null;

  const relevantTips = selectedRound === null
    ? tips
    : tips.filter((t) => t.match.round === selectedRound);

  const rowsByUser = new Map<number, LeaderboardRow>();
  for (const user of users) {
    rowsByUser.set(user.id, {
      userId: user.id,
      name: user.name,
      total: 0,
      byTeam: teams.map((t) => ({ teamId: t.id, teamName: t.name, points: 0 })),
    });
  }

  for (const tip of relevantTips) {
    const row = rowsByUser.get(tip.userId);
    if (!row) continue;
    const points = tip.totalPoints ?? 0;
    row.total += points;
    const team = teamById.get(tip.match.teamId);
    if (team) {
      const teamEntry = row.byTeam.find((b) => b.teamId === team.id);
      if (teamEntry) teamEntry.points += points;
    }
  }

  const rows = Array.from(rowsByUser.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-club-primary">Žebříček</h1>

      {allRounds.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/leaderboard"
            className={
              selectedRound === null ? "btn-primary text-sm" : "btn-secondary text-sm"
            }
          >
            Celkově
          </Link>
          {allRounds.map((round) => (
            <Link
              key={round}
              href={`/leaderboard?round=${round}`}
              className={
                selectedRound === round ? "btn-primary text-sm" : "btn-secondary text-sm"
              }
            >
              Kolo {round}
            </Link>
          ))}
        </div>
      )}

      <LeaderboardTable
        rows={rows}
        teamNames={teams.map((t) => t.name)}
        currentUserId={session.user.id}
      />
    </div>
  );
}
