import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// See lib/prisma.ts for why this uses the standard Prisma Client (native
// query engine, no driver adapter). This seed runs automatically as part of
// `npm run build` (see package.json) so the four teams + superadmin exist
// right after the first deploy - it's idempotent (safe to run on every
// build).
const prisma = new PrismaClient();

// Seeds the four club teams and a placeholder starting roster for each, plus
// a single SUPERADMIN account. Deliberately does NOT seed fake matches or
// members - real fixtures should be created by team admins via /admin.
async function main() {
  const teamDefs = [
    { name: "A muži", slug: "a-muzi", players: ["Jan Novák", "Petr Svoboda", "Tomáš Dvořák"] },
    { name: "B muži", slug: "b-muzi", players: ["Karel Černý", "Lukáš Procházka", "Martin Kučera"] },
    { name: "A ženy", slug: "a-zeny", players: ["Eva Malá", "Anna Veselá", "Tereza Horáková"] },
    { name: "A dorost", slug: "a-dorost", players: ["Filip Král", "David Pokorný", "Adam Sedláček"] },
  ];

  for (const def of teamDefs) {
    const team = await prisma.team.upsert({
      where: { slug: def.slug },
      update: {},
      create: { name: def.name, slug: def.slug },
    });

    for (const playerName of def.players) {
      const existing = await prisma.player.findFirst({
        where: { teamId: team.id, name: playerName },
      });
      if (!existing) {
        await prisma.player.create({
          data: { teamId: team.id, name: playerName },
        });
      }
    }

    console.log(`Tým "${def.name}" připraven (placeholder hráči - uprav v administraci).`);
  }

  const adminName = process.env.SEED_ADMIN_NAME || "Admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "zmenteheslo123";

  const existingAdmin = await prisma.user.findFirst({
    where: { name: adminName },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        passwordHash,
        role: "SUPERADMIN",
      },
    });
    console.log(`Superadmin "${adminName}" vytvořen.`);
  } else {
    console.log(`Superadmin "${adminName}" už existuje, přeskočeno.`);
  }

  console.log("");
  console.log("=================================================");
  console.log(`  Přihlašovací jméno superadmina: ${adminName}`);
  console.log(`  Heslo superadmina: ${adminPassword}`);
  console.log("  UPOZORNĚNÍ: Po prvním přihlášení si prosím ZMĚŇ");
  console.log("  toto heslo v sekci Uživatelé (Administrace)!");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
