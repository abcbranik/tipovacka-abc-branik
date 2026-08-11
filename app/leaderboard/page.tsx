import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import LeaderboardTable, {
  LeaderboardRow,
} from "@/components/LeaderboardTable";

export default async function LeaderboardPage() {
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

  const rowsByUser = new Map<number, LeaderboardRow>();
  for (const user of users) {
    rowsByUser.set(user.id, {
      userId: user.id,
      name: user.name,
      total: 0,
      byTeam: teams.map((t) => ({ teamId: t.id, teamName: t.name, points: 0 })),
    });
  }

  for (const tip of tips) {
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
      <LeaderboardTable
        rows={rows}
        teamNames={teams.map((t) => t.name)}
        currentUserId={session.user.id}
      />
    </div>
  );
}
