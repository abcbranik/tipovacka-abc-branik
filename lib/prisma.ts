import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Uses Prisma's driver adapter mode with @prisma/adapter-pg as the actual
// Postgres driver (targeting Neon in production - see README.md). Prisma
// Client then uses its bundled WebAssembly query compiler together with
// this JS driver to run queries, instead of a native Rust query-engine
// binary. This is the Postgres counterpart of the better-sqlite3 adapter
// used in the local-dev/SQLite copy of this project - same architecture,
// different driver.
//
// Neon's connection strings work as a standard Postgres URL, so no extra
// parsing is needed here (unlike the SQLite file-path case).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
