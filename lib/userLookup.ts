import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Finds a user by name, case-insensitively. SQLite's default collation for
 * `=` comparisons is case-sensitive (unlike Postgres with mode:
 * "insensitive"), so we compare using LOWER() explicitly. This keeps the
 * behaviour consistent regardless of which database provider is used.
 */
export async function findUserByNameCaseInsensitive(
  name: string
): Promise<User | null> {
  // Club member lists are small, so a full scan + JS comparison is simple
  // and reliable across database providers (SQLite's `=` is case-sensitive,
  // unlike Postgres' `mode: "insensitive"`).
  const users = await prisma.user.findMany();
  const lower = name.toLowerCase();
  return users.find((u) => u.name.toLowerCase() === lower) ?? null;
}
