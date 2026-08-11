"use client";

import { useState } from "react";

export interface LeaderboardRow {
  userId: number;
  name: string;
  total: number;
  byTeam: { teamId: number; teamName: string; points: number }[];
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  teamNames: string[];
  currentUserId: number;
}

export default function LeaderboardTable({
  rows,
  teamNames,
  currentUserId,
}: LeaderboardTableProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="btn-secondary mb-4"
      >
        {showBreakdown ? "Skrýt rozpad podle týmů" : "Zobrazit rozpad podle týmů"}
      </button>
      <div className="overflow-x-auto">
        <table className="w-full text-sm card">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Jméno</th>
              {showBreakdown &&
                teamNames.map((t) => (
                  <th key={t} className="py-2 pr-2 whitespace-nowrap">
                    {t}
                  </th>
                ))}
              <th className="py-2 pr-2 text-right">Celkem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.userId}
                className={`border-b last:border-0 ${
                  row.userId === currentUserId
                    ? "bg-club-primary-light font-semibold"
                    : ""
                }`}
              >
                <td className="py-2 pr-2">{idx + 1}.</td>
                <td className="py-2 pr-2">{row.name}</td>
                {showBreakdown &&
                  teamNames.map((t) => {
                    const entry = row.byTeam.find((b) => b.teamName === t);
                    return (
                      <td key={t} className="py-2 pr-2">
                        {entry?.points ?? 0}
                      </td>
                    );
                  })}
                <td className="py-2 pr-2 text-right font-bold text-club-primary">
                  {row.total}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  Zatím žádné bodované tipy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
