import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { findUserByNameCaseInsensitive } from "@/lib/userLookup";

/**
 * next-auth configuration using the Credentials provider with JWT session
 * strategy (no database session adapter needed). The JWT / session carries:
 *   - userId
 * - name
 *   - role
 *   - teamIds: the list of team ids this user administers (empty for
 *     plain members; for SUPERADMIN this is also empty because they
 *     implicitly manage all teams - check role === "SUPERADMIN" instead).
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Jméno", type: "text" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) {
          return null;
        }

        const userRecord = await findUserByNameCaseInsensitive(
          credentials.name
        );
        if (!userRecord) return null;

        const user = await prisma.user.findUnique({
          where: { id: userRecord.id },
          include: { adminTeams: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          role: user.role,
          teamIds: user.adminTeams.map((at) => at.teamId),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = Number(user.id);
        token.name = user.name;
        token.role = (user as any).role;
        token.teamIds = (user as any).teamIds ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as number;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.teamIds = (token.teamIds as number[]) ?? [];
      }
      return session;
    },
  },
};
