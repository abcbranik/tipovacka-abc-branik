"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface NavProps {
  name: string;
  role: string;
}

export default function Nav({ name, role }: NavProps) {
  const [open, setOpen] = useState(false);
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  const links = [
    { href: "/", label: "Přehled" },
    { href: "/leaderboard", label: "Žebříček" },
    { href: "/pravidla", label: "Pravidla" },
    ...(isAdmin ? [{ href: "/admin", label: "Administrace" }] : []),
    ...(role === "SUPERADMIN"
      ? [{ href: "/admin/users", label: "Uživatelé" }]
      : []),
  ];

  return (
    <nav className="bg-club-primary-dark text-white shadow-md sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Image src="/logo.png" alt="Klubové logo" width={32} height={32} className="h-8 w-8" />
            <span>Tipovačka</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium hover:underline"
              >
                {l.label}
              </Link>
            ))}
            <span className="text-sm opacity-90">{name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm font-medium bg-white/10 hover:bg-white/20 rounded px-3 py-1.5"
            >
              Odhlásit se
            </button>
          </div>
          <button
            className="sm:hidden p-2"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
        {open && (
          <div className="sm:hidden pb-3 flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium py-1"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <span className="text-sm opacity-90 py-1">Přihlášen(a): {name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm font-medium bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-left"
            >
              Odhlásit se
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
