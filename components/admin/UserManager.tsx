"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamOption {
  id: number;
  name: string;
}

interface UserRow {
  id: number;
  name: string;
  role: "SUPERADMIN" | "ADMIN" | "MEMBER";
  teamIds: number[];
}

const roleBadgeClass: Record<UserRow["role"], string> = {
  SUPERADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-700",
};

const roleLabel: Record<UserRow["role"], string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  MEMBER: "Člen",
};

export default function UserManager({
  users,
  teams,
  currentUserId,
}: {
  users: UserRow[];
  teams: TeamOption[];
  currentUserId: number;
}) {
  return (
    <div className="space-y-3">
      {users.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          teams={teams}
          isSelf={u.id === currentUserId}
        />
      ))}
    </div>
  );
}

function UserCard({
  user,
  teams,
  isSelf,
}: {
  user: UserRow;
  teams: TeamOption[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [teamIds, setTeamIds] = useState<Set<number>>(new Set(user.teamIds));
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleTeam(id: number) {
    setTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save(body: Record<string, unknown>, successMsg: string) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Uložení se nepodařilo.");
      return;
    }
    setSuccess(successMsg);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">
          {user.name}{" "}
          {isSelf && <span className="text-xs text-gray-500">(ty)</span>}
        </div>
        <span className={`badge ${roleBadgeClass[role]}`}>
          {roleLabel[role]}
        </span>
      </div>

      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      {success && <p className="text-sm text-club-primary mt-2">{success}</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Role</label>
          <div className="flex gap-2">
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRow["role"])}
              disabled={isSelf}
            >
              <option value="MEMBER">Člen</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
            <button
              className="btn-secondary text-xs whitespace-nowrap"
              disabled={loading || isSelf}
              onClick={() => save({ role }, "Role uložena.")}
            >
              Uložit
            </button>
          </div>
          {isSelf && (
            <p className="text-xs text-gray-500 mt-1">
              Vlastní roli si nemůžeš změnit.
            </p>
          )}
        </div>

        <div>
          <label className="label">Nové heslo</label>
          <div className="flex gap-2">
            <input
              className="input"
              type="password"
              placeholder="min. 6 znaků"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="btn-secondary text-xs whitespace-nowrap"
              disabled={loading || newPassword.length < 6}
              onClick={() => {
                save({ newPassword }, "Heslo resetováno.");
                setNewPassword("");
              }}
            >
              Resetovat
            </button>
          </div>
        </div>
      </div>

      {role === "ADMIN" && (
        <div className="mt-3">
          <label className="label">Správcuje týmy</label>
          <div className="flex flex-wrap gap-3 mb-2">
            {teams.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={teamIds.has(t.id)}
                  onChange={() => toggleTeam(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
          <button
            className="btn-secondary text-xs"
            disabled={loading}
            onClick={() =>
              save(
                { teamIds: Array.from(teamIds) },
                "Přiřazené týmy uloženy."
              )
            }
          >
            Uložit přiřazené týmy
          </button>
        </div>
      )}
    </div>
  );
}
