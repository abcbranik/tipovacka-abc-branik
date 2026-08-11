import type { Metadata } from "next";
import "./globals.css";
import { getCurrentSession } from "@/lib/authGuards";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Tipovačka ABC Braník",
  description: "Tipovačka pro zápasy fotbalového klubu ABC Braník",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  return (
    <html lang="cs">
      <body>
        {session?.user && (
          <Nav name={session.user.name} role={session.user.role} />
        )}
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
