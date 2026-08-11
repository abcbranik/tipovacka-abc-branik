import { PrismaClient } from "@prisma/client";

// Standard Prisma Client, using the native query engine binary (downloaded
// automatically at `prisma generate` time on Vercel's build servers) and
// connecting directly via DATABASE_URL. This is the well-tested, default
// setup for Prisma + Postgres on Vercel's Node.js serverless functions - no
// driver adapter needed. (An earlier version of this file used
// @prisma/adapter-pg with Prisma's WASM "client" engine type, but that mode's
// query_compiler_bg.wasm file wasn't being included in Vercel's function
// bundle, causing runtime ENOENT errors.)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
