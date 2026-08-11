import type { DefaultSession } from "next-auth";

// Augments next-auth's built-in types so that session.user and the JWT
// carry our custom fields: numeric id, role, and administered team ids.
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name: string;
      role: string;
      teamIds: number[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    role: string;
    teamIds: number[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: number;
    name: string;
    role: string;
    teamIds: number[];
  }
}
