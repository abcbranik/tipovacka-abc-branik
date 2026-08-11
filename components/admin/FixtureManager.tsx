"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKickoff, venueLabel } from "@/lib/format";

interface PlayerRow {
  id: number;
  name: string;
}

interface ScorerRow {
  playerId: number;
}

interface MatchRow {
  id: number;
  round: number;
  opponent: string;
  venue: "HOME" | "AWAY";
  kickoffAt: string; // ISO string
  status: "SCHEDULED" | "FINISHED";
  ourScore: number | null;
  opponentScore: number | null;
  scorers: ScorerRow[];
}

export default function FixtureManager({
  matches,
  players,
}: {
  matches: MatchRow[];
  players: PlayerRow[];
}) {
  const [openResultFor, setOpenResultFor] = useState<number | null>(null);

  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  );

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Zápasy</h3>
      {sorted.length === 0 && (
        <p className="text-sm text-gray-500">Zatím žádné zápasy.</p>
      )}
      <ul className="divide-y">
        {sorted.map((m) => (
          <li key={m.id} className="py-3">
            <div className="flex justify-between items-baseline gap-2">
              <div>
                <div className="font-medium">
                  vs {m.opponent} ({venueLabel(m.venue)})
                </div>
                <div className="text-xs text-gray-500">
                  soutěžní kolo {m.round} · {formatKickoff(new Date(m.kickoffAt))}
                </div>
              </div>
              <div className="text-right">
                {m.status === "FINISHED" ? (
                  <div className="font-bold">
                    {m.ourScore} : {m.opponentScore}
                  </div>
                ) : (
                  <span className="badge bg-gray-100 text-gray-600">
                    Naplánováno
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn-secondary text-xs mt-2"
              onClick={() =>
                setOpenResultFor(openResultFor === m.id ? null : m.id)
              }
            >
              {m.status === "FINISHED" ? "Upravit výsledek" : "Zadat výsledek"}
            </button>
            {openResultFor === m.id && (
              <ResultForm
                match={m}
                players={players}
                onDone={() => setOpenResultFor(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultForm({
  match,
  players,
  onDone,
}: {
  match: MatchRow;
  players: PlayerRow[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [ourScore, setOurScore] = useState(
    match.ourScore !== null ? String(match.ourScore) : ""
  );
  const [opponentScore, setOpponentScore] = useState(
    match.opponentScore !== null ? String(match.opponentScore) : ""
  );
  const initialScorerIds = new Set(match.scorers.map((s) => s.playerId));
  const [scorerIds, setScorerIds] = useState<Set<number>>(initialScorerIds);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleScorer(id: number) {
    setScorerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/matches/${match.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ourScore: Number(ourScore),
        opponentScore: Number(opponentScore),
        scorerPlayerIds: Array.from(scorerIds),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Výsledek se nepodařilo uložit.");
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 bg-club-primary-light border border-club-primary/30 rounded p-3 space-y-3"
    >
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="label">Naše skóre</label>
          <input
            className="input text-center"
            type="number"
            min={0}
            value={ourScore}
            onChange={(e) => setOurScore(e.target.value)}
            required
          />
        </div>
        <span className="pt-6 font-bold text-gray-400">:</span>
        <div className="flex-1">
          <label className="label">Skóre soupeře</label>
          <input
            className="input text-center"
            type="number"
            min={0}
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Kdo dal gól za náš tým (zaškrtni všechny)</label>
        {players.length === 0 && (
          <p className="text-sm text-gray-500">Tým nemá zadanou soupisku.</p>
        )}
        <div className="flex flex-wrap gap-3">
          {players.map((p) => (
            <label key={p.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={scorerIds.has(p.id)}
                onChange={() => toggleScorer(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Ukládám..." : "Uložit výsledek"}
      </button>
    </form>
  );
}
