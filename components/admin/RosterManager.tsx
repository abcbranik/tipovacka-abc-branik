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
  const [bulkNames, setBulkNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function addBulkPlayers(e: React.FormEvent) {
    e.preventDefault();
    setBulkError(null);
    setBulkResult(null);
    const names = bulkNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, names }),
      });
      const data = await res.json();
      setBulkLoading(false);
      if (!res.ok) {
        setBulkError(data.error || "Hráče se nepodařilo přidat.");
        return;
      }
      setBulkNames("");
      const parts: string[] = [];
      if (data.created?.length) {
        parts.push(`přidáno ${data.created.length}: ${data.created.join(", ")}`);
      }
      if (data.skipped?.length) {
        parts.push(
          `přeskočeno (už existují) ${data.skipped.length}: ${data.skipped.join(", ")}`
        );
      }
      setBulkResult(parts.join(" · ") || "Nic k přidání.");
      router.refresh();
    } catch (err: any) {
      setBulkLoading(false);
      setBulkError(`Nastala chyba: ${err?.message || String(err)}`);
    }
  }

  async function toggleActive(playerId: number, active: boolean) {
    await fetch(`/api/admin/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    router.refresh();
  }

  async function deletePlayer(playerId: number, name: string) {
    setDeleteError(null);
    if (!window.confirm(`Opravdu trvale smazat hráče „${name}“?`)) return;
    const res = await fetch(`/api/admin/players/${playerId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setDeleteError(data.error || "Hráče se nepodařilo smazat.");
      return;
    }
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
            <span className="flex gap-2">
              <button
                onClick={() => toggleActive(p.id, !p.active)}
                className={p.active ? "btn-secondary text-xs" : "btn-primary text-xs"}
              >
                {p.active ? "Deaktivovat" : "Aktivovat"}
              </button>
              {!p.active && (
                <button
                  onClick={() => deletePlayer(p.id, p.name)}
                  className="btn-secondary text-xs text-red-700"
                >
                  Smazat
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {deleteError && <p className="text-sm text-red-700 mb-4">{deleteError}</p>}

      <form onSubmit={addPlayer} className="flex gap-2 mb-4">
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
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <details className="border-t pt-3">
        <summary className="text-sm font-semibold cursor-pointer">
          Hromadně vložit celou soupisku
        </summary>
        <form onSubmit={addBulkPlayers} className="mt-3 space-y-2">
          <p className="text-xs text-gray-500">
            Vlož jedno jméno hráče na řádek (klidně zkopírované odjinud) a
            klikni na „Přidat všechny“. Hráči, kteří už v soupisce jsou, se
            automaticky přeskočí.
          </p>
          <textarea
            className="input"
            rows={6}
            placeholder={"Jan Novák\nPetr Svoboda\nTomáš Dvořák"}
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
          />
          <button
            type="submit"
            disabled={bulkLoading}
            className="btn-primary whitespace-nowrap"
          >
            {bulkLoading ? "Ukládám..." : "Přidat všechny"}
          </button>
        </form>
        {bulkError && <p className="text-sm text-red-700 mt-2">{bulkError}</p>}
        {bulkResult && (
          <p className="text-sm text-club-primary mt-2">{bulkResult}</p>
        )}
      </details>
    </div>
  );
}
