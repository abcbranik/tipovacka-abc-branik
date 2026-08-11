/**
 * SQLite has no native enum type, so the Prisma schema models Role, Venue
 * and MatchStatus as plain String columns (see prisma/schema.prisma). These
 * TypeScript union types document and constrain the allowed values used
 * throughout the application code.
 */
export type Role = "SUPERADMIN" | "ADMIN" | "MEMBER";
export type Venue = "HOME" | "AWAY";
export type MatchStatus = "SCHEDULED" | "FINISHED";
