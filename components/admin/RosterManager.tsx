"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlayerRow {
  id: number;
  name: string;
  active: boolean;
}

export default function RosterManager({
  teamId,
  players,
}: {
  teamId: number;
  players: PlayerRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Hráče se nepodařilo přidat.");
      return;
    }
    setName("");
    router.refresh();
  }

  async function toggleActive(playerId: number, active: boolean) {
    await fetch(`/api/admin/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    router.refresh();
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Soupiska hráčů</h3>
      {players.length === 0 && (
        <p className="text-sm text-gray-500 mb-3">
          Tým ještě nemá žádné hráče v soupisce.
        </p>
      )}
      <ul className="divide-y mb-4">
        {players.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <span className={p.active ? "" : "text-gray-400 line-through"}>
              {p.name}
            </span>
            <button
              onClick={() => toggleActive(p.id, !p.active)}
              className={p.active ? "btn-secondary text-xs" : "btn-primary text-xs"}
            >
              {p.active ? "Deaktivovat" : "Aktivovat"}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addPlayer} className="flex gap-2">
        <input
          className="input"
          placeholder="Jméno nového hráče"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
          Přidat hráče
        </button>
      </form>
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  );
}
