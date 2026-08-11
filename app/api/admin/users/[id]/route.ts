import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, isSuperAdmin } from "@/lib/authGuards";

/**
 * Superadmin-only user management: change role, assign/unassign teams an
 * ADMIN manages, and/or reset the user's password.
 * Body (all fields optional): {
 *   role?: "SUPERADMIN"|"ADMIN"|"MEMBER",
 *   teamIds?: number[],
 *   newPassword?: string
 * }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json(
      { error: "Pouze superadmin může upravovat uživatele." },
      { status: 403 }
    );
  }

  const userId = Number(params.id);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Uživatel neexistuje." }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }

  if (
    body.role !== undefined &&
    !["SUPERADMIN", "ADMIN", "MEMBER"].includes(body.role)
  ) {
    return NextResponse.json({ error: "Neplatná role." }, { status: 400 });
  }

  if (body.newPassword !== undefined) {
    const pw = String(body.newPassword);
    if (pw.length < 6) {
      return NextResponse.json(
        { error: "Nové heslo musí mít alespoň 6 znaků." },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.newPassword !== undefined) {
      data.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
    }
    if (Object.keys(data).length > 0) {
      await tx.user.update({ where: { id: userId }, data });
    }

    if (Array.isArray(body.teamIds)) {
      const teamIds: number[] = body.teamIds
        .map((x: unknown) => Number(x))
        .filter(Number.isInteger);
      await tx.adminTeam.deleteMany({ where: { userId } });
      if (teamIds.length > 0) {
        await tx.adminTeam.createMany({
          data: Array.from(new Set(teamIds)).map((teamId) => ({
            userId,
            teamId,
          })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
