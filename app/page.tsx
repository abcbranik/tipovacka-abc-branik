import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import TipForm from "@/components/TipForm";
import { formatKickoff, venueLabel } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const teams = await prisma.team.findMany({
    orderBy: { id: "asc" },
    include: {
      players: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  const [upcomingMatches, finishedMatches] = await Promise.all([
    prisma.match.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { kickoffAt: "asc" },
    }),
    prisma.match.findMany({
      where: { status: "FINISHED" },
      orderBy: { kickoffAt: "desc" },
      include: { scorers: { include: { player: true } } },
    }),
  ]);

  const allMatchIds = [...upcomingMatches, ...finishedMatches].map((m) => m.id);
  const myTips = await prisma.tip.findMany({
    where: { userId: session.user.id, matchId: { in: allMatchIds } },
    include: { predictedPlayer: true },
  });
  const tipByMatchId = new Map(myTips.map((t) => [t.matchId, t]));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-club-primary">Přehled</h1>

      {teams.map((team) => {
        const teamUpcoming = upcomingMatches
          .filter((m) => m.teamId === team.id)
          .slice(0, 3);
        const teamFinished = finishedMatches
          .filter((m) => m.teamId === team.id)
          .slice(0, 5);

        return (
          <section key={team.id}>
            <h2 className="text-xl font-semibold mb-3">{team.name}</h2>

            {teamUpcoming.length === 0 && teamFinished.length === 0 && (
              <p className="text-gray-500 text-sm">
                Zatím žádné naplánované zápasy.
              </p>
            )}

            {teamUpcoming.length > 0 && (
              <div className="space-y-3 mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nadcházející zápasy
                </h3>
                {teamUpcoming.map((match) => {
                  const existingTip = tipByMatchId.get(match.id);
                  return (
                    <div key={match.id} className="card">
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="font-semibold">
                          {team.name} – {match.opponent}{" "}
                          <span className="text-gray-500 font-normal">
                            ({venueLabel(match.venue)})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          kolo {match.round}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatKickoff(match.kickoffAt)}
                      </div>
                      {team.players.length === 0 ? (
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                          Tým ještě nemá zadanou soupisku hráčů, tip na
                          střelce zatím nelze vybrat. Kontaktuj administrátora
                          týmu.
                        </p>
                      ) : (
                        <TipForm
                          matchId={match.id}
                          players={team.players.map((p) => ({
                            id: p.id,
                            name: p.name,
                          }))}
                          initialOurScore={existingTip?.predOurScore}
                          initialOpponentScore={existingTip?.predOpponentScore}
                          initialPlayerId={existingTip?.predictedPlayerId}
                          hasExistingTip={!!existingTip}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {teamFinished.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Odehrané zápasy
                </h3>
                {teamFinished.map((match) => {
                  const tip = tipByMatchId.get(match.id);
                  const scorerNames = match.scorers.map((s) => s.player.name);
                  const earnedPoints = (tip?.totalPoints ?? 0) > 0;

                  return (
                    <div
                      key={match.id}
                      className={`card ${
                        earnedPoints ? "border-club-primary bg-club-primary-light" : ""
                      }`}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="font-semibold">
                          {team.name} – {match.opponent}{" "}
                          <span className="text-gray-500 font-normal">
                            ({venueLabel(match.venue)})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          kolo {match.round}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatKickoff(match.kickoffAt)}
                      </div>
                      <div className="mt-2 text-lg font-bold">
                        Výsledek: {match.ourScore} : {match.opponentScore}
                      </div>
                      <div className="text-sm text-gray-700">
                        Střelci:{" "}
                        {scorerNames.length > 0
                          ? scorerNames.join(", ")
                          : "nikdo z našich nedal gól"}
                      </div>

                      {tip ? (
                        <div className="mt-3 border-t pt-2 text-sm space-y-1">
                          <div>
                            Tvůj tip:{" "}
                            <span className="font-semibold">
                              {tip.predOurScore} : {tip.predOpponentScore}
                            </span>
                            {" – střelec: "}
                            <span className="font-semibold">
                              {tip.predictedPlayer?.name ?? "nikdo z nás"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <span>
                              Body za výsledek:{" "}
                              <strong>{tip.resultPoints ?? 0}</strong>
                            </span>
                            <span>
                              Body za střelce:{" "}
                              <strong>{tip.scorerPoints ?? 0}</strong>
                            </span>
                            <span
                              className={
                                earnedPoints
                                  ? "text-club-primary font-bold"
                                  : "font-bold"
                              }
                            >
                              Celkem: {tip.totalPoints ?? 0} b.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 border-t pt-2 text-sm text-gray-500">
                          Na tento zápas jsi nezadal(a) tip.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
