import { redirect } from "next/navigation";
import { getCurrentSession, isSuperAdmin } from "@/lib/authGuards";
import { prisma } from "@/lib/prisma";
import UserManager from "@/components/admin/UserManager";

export default async function AdminUsersPage() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");
  if (!isSuperAdmin(session)) redirect("/admin");

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { adminTeams: true },
    }),
    prisma.team.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-club-primary">Uživatelé</h1>
      <p className="text-sm text-gray-600">
        Zde můžeš měnit role uživatelů, přiřazovat administrátorům týmy ke
        správě a resetovat hesla.
      </p>
      <UserManager
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role as "SUPERADMIN" | "ADMIN" | "MEMBER",
          teamIds: u.adminTeams.map((at) => at.teamId),
        }))}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
