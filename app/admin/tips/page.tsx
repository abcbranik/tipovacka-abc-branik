import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, isAnyAdmin } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import { formatKickoff, venueLabel } from "@/lib/format";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: { team?: string; match?: string };
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

  const matches = await prisma.match.findMany({
    where: { teamId: selectedTeam.id },
    orderBy: { kickoffAt: "desc" },
  });

  const requestedMatchId = Number(searchParams.match);
  const selectedMatch =
    matches.find((m) => m.id === requestedMatchId) ?? matches[0] ?? null;

  const tips = selectedMatch
    ? await prisma.tip.findMany({
        where: { matchId: selectedMatch.id },
        include: { user: true, predictedPlayer: true },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-club-primary">Tipy hráčů</h1>

      {manageableTeams.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {manageableTeams.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tips?team=${t.id}`}
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

      {matches.length === 0 && (
        <p className="text-sm text-gray-500">
          Tento tým ještě nemá žádné zápasy.
        </p>
      )}

      {matches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/admin/tips?team=${selectedTeam.id}&match=${m.id}`}
              className={
                selectedMatch?.id === m.id
                  ? "btn-primary text-sm"
                  : "btn-secondary text-sm"
              }
            >
              soutěžní kolo {m.round} · vs {m.opponent}
            </Link>
          ))}
        </div>
      )}

      {selectedMatch && (
        <div className="card">
          <h2 className="font-semibold mb-1">
            {selectedTeam.name} – {selectedMatch.opponent} (
            {venueLabel(selectedMatch.venue)})
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            soutěžní kolo {selectedMatch.round} ·{" "}
            {formatKickoff(selectedMatch.kickoffAt)}
            {selectedMatch.status === "FINISHED" && (
              <>
                {" "}
                · výsledek {selectedMatch.ourScore} :{" "}
                {selectedMatch.opponentScore}
              </>
            )}
          </p>

          {tips.length === 0 ? (
            <p className="text-sm text-gray-500">
              Na tento zápas ještě nikdo nezadal tip.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1 pr-3">Tipér</th>
                    <th className="py-1 pr-3">Tip skóre</th>
                    <th className="py-1 pr-3">Tip střelec</th>
                    <th className="py-1 pr-3">Body za výsledek</th>
                    <th className="py-1 pr-3">Body za střelce</th>
                    <th className="py-1 pr-3">Celkem</th>
                  </tr>
                </thead>
                <tbody>
                  {tips.map((tip) => (
                    <tr key={tip.id} className="border-b last:border-0">
                      <td className="py-1 pr-3">{tip.user.name}</td>
                      <td className="py-1 pr-3">
                        {tip.predOurScore} : {tip.predOpponentScore}
                      </td>
                      <td className="py-1 pr-3">
                        {tip.predictedPlayer?.name ?? "nikdo z nás"}
                      </td>
                      <td className="py-1 pr-3">{tip.resultPoints ?? "–"}</td>
                      <td className="py-1 pr-3">{tip.scorerPoints ?? "–"}</td>
                      <td className="py-1 pr-3 font-semibold">
                        {tip.totalPoints ?? "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


