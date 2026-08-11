"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      name,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Nesprávné jméno nebo heslo.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="text-center mb-6">
        <Image
          src="/logo.png"
          alt="Klubové logo"
          width={80}
          height={80}
          className="mx-auto mb-2 h-20 w-20"
        />
        <h1 className="text-2xl font-bold text-club-primary-dark">Tipovačka</h1>
        <p className="text-sm text-gray-600">Přihlas se ke svému účtu</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        <div>
          <label className="label">Jméno</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Heslo</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Přihlašuji..." : "Přihlásit se"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Nemáš účet?{" "}
        <Link href="/register" className="text-club-primary font-semibold">
          Zaregistruj se
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
