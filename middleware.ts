import { withAuth } from "next-auth/middleware";

// Guards /admin/** routes: only ADMIN and SUPERADMIN may enter at all.
// Fine-grained scoping to specific teams (for ADMIN) happens server-side
// in each page / API route, since that requires a database lookup this
// lightweight middleware should not do on every request.
export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      return token?.role === "ADMIN" || token?.role === "SUPERADMIN";
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
