"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMatchForm({ teamId }: { teamId: number }) {
  const router = useRouter();
  const [round, setRound] = useState("");
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState<"HOME" | "AWAY">("HOME");
  const [kickoffAt, setKickoffAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        round: Number(round),
        opponent,
        venue,
        kickoffAt,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Zápas se nepodařilo přidat.");
      return;
    }
    setRound("");
    setOpponent("");
    setKickoffAt("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Přidat zápas</h3>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Soutěžní kolo</label>
          <input
            className="input"
            type="number"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Číslo kola tipovačky – nemusí přesně sedět se skutečným číslem
            kola dané soutěže (např. u kategorií, které začínají o týden
            později).
          </p>
        </div>
        <div>
          <label className="label">Místo</label>
          <select
            className="input"
            value={venue}
            onChange={(e) => setVenue(e.target.value as "HOME" | "AWAY")}
          >
            <option value="HOME">Doma</option>
            <option value="AWAY">Venku</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Soupeř</label>
        <input
          className="input"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Datum a čas výkopu</label>
        <input
          className="input"
          type="datetime-local"
          value={kickoffAt}
          onChange={(e) => setKickoffAt(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Ukládám..." : "Přidat zápas"}
      </button>
    </form>
  );
}
