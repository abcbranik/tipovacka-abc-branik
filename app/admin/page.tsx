import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, isAnyAdmin } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import RosterManager from "@/components/admin/RosterManager";
import AddMatchForm from "@/components/admin/AddMatchForm";
import FixtureManager from "@/components/admin/FixtureManager";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");
  if (!isAnyAdmin(session)) redirect("/");

  const allTeams = await prisma.team.findMany({ orderBy: { id: "asc" } });
  const manageableTeams =
    session.user.role === "SUPERADMIN"
      ? allTeams
      : allTeams.filter((t) => session.user.teamIds.includes(t.id));

  if (manageableTeams.length === 0) {
    return (
      <div className="card">
        <p>
          Nemáš přiřazený žádný tým ke správě. Kontaktuj superadmina, aby ti
          tým přiřadil v sekci Uživatelé.
        </p>
      </div>
    );
  }

  const requestedTeamId = Number(searchParams.team);
  const selectedTeam =
    manageableTeams.find((t) => t.id === requestedTeamId) ?? manageableTeams[0];

  const [players, matches] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: selectedTeam.id },
      orderBy: { name: "asc" },
    }),
    prisma.match.findMany({
      where: { teamId: selectedTeam.id },
      orderBy: { kickoffAt: "desc" },
      include: { scorers: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-club-primary">Administrace</h1>

      {manageableTeams.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {manageableTeams.map((t) => (
            <Link
              key={t.id}
              href={`/admin?team=${t.id}`}
              className={
                t.id === selectedTeam.id
                  ? "btn-primary text-sm"
                  : "btn-secondary text-sm"
              }
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold">{selectedTeam.name}</h2>

      <RosterManager
        teamId={selectedTeam.id}
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          active: p.active,
        }))}
      />

      <FixtureManager
        matches={matches.map((m) => ({
          id: m.id,
          round: m.round,
          opponent: m.opponent,
          venue: m.venue as "HOME" | "AWAY",
          kickoffAt: m.kickoffAt.toISOString(),
          status: m.status as "SCHEDULED" | "FINISHED",
          ourScore: m.ourScore,
          opponentScore: m.opponentScore,
          scorers: m.scorers.map((s) => ({ playerId: s.playerId })),
        }))}
        players={players.map((p) => ({ id: p.id, name: p.name }))}
      />

      <AddMatchForm teamId={selectedTeam.id} />
    </div>
  );
}
