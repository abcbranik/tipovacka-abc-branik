"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlayerOption {
  id: number;
  name: string;
}

interface TipFormProps {
  matchId: number;
  players: PlayerOption[];
  initialOurScore?: number;
  initialOpponentScore?: number;
  initialPlayerId?: number | null;
  hasExistingTip: boolean;
}

const NO_SCORER_VALUE = "none";

export default function TipForm({
  matchId,
  players,
  initialOurScore,
  initialOpponentScore,
  initialPlayerId,
  hasExistingTip,
}: TipFormProps) {
  const router = useRouter();
  const [ourScore, setOurScore] = useState(
    initialOurScore !== undefined ? String(initialOurScore) : ""
  );
  const [opponentScore, setOpponentScore] = useState(
    initialOpponentScore !== undefined ? String(initialOpponentScore) : ""
  );
  const [playerChoice, setPlayerChoice] = useState<string>(
    initialPlayerId !== undefined && initialPlayerId !== null
      ? String(initialPlayerId)
      : NO_SCORER_VALUE
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const ourScoreNum = Number(ourScore);
    const opponentScoreNum = Number(opponentScore);
    if (
      ourScore === "" ||
      opponentScore === "" ||
      !Number.isInteger(ourScoreNum) ||
      !Number.isInteger(opponentScoreNum) ||
      ourScoreNum < 0 ||
      opponentScoreNum < 0
    ) {
      setError("Zadej platné skóre (celá čísla, 0 a víc).");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        predOurScore: ourScoreNum,
        predOpponentScore: opponentScoreNum,
        predictedPlayerId:
          playerChoice === NO_SCORER_VALUE ? null : Number(playerChoice),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Tip se nepodařilo uložit.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-club-primary bg-club-primary-light border border-club-primary rounded p-2">
          Tip uložen!
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="label">Naše</label>
          <input
            className="input text-center"
            type="number"
            min={0}
            inputMode="numeric"
            value={ourScore}
            onChange={(e) => setOurScore(e.target.value)}
            required
          />
        </div>
        <span className="pt-6 font-bold text-gray-400">:</span>
        <div className="flex-1">
          <label className="label">Soupeř</label>
          <input
            className="input text-center"
            type="number"
            min={0}
            inputMode="numeric"
            value={opponentScore}
            onChange={(e) => setOpponentScore(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Střelec za náš tým</label>
        <select
          className="input"
          value={playerChoice}
          onChange={(e) => setPlayerChoice(e.target.value)}
        >
          <option value={NO_SCORER_VALUE}>Nikdo z nás nedá gól</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Ukládám..." : hasExistingTip ? "Upravit tip" : "Uložit tip"}
      </button>
    </form>
  );
}
