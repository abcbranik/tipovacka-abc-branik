"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, confirmPassword }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setLoading(false);
        setError(
          `Server odpověděl neočekávaně (stav ${res.status}). Zkus to prosím znovu.`
        );
        return;
      }

      if (!res.ok) {
        setLoading(false);
        setError(data.error || "Registraci se nepodařilo dokončit.");
        return;
      }

      const signInRes = await signIn("credentials", {
        name,
        password,
        redirect: false,
      });
      setLoading(false);
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      setError(
        `Nastala neočekávaná chyba: ${err?.message || String(err)}`
      );
    }
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
        <h1 className="text-2xl font-bold text-club-primary-dark">Registrace</h1>
        <p className="text-sm text-gray-600">Vytvoř si účet do tipovačky</p>
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
            minLength={6}
          />
        </div>
        <div>
          <label className="label">Heslo znovu</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Registruji..." : "Zaregistrovat se"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Už máš účet?{" "}
        <Link href="/login" className="text-club-primary font-semibold">
          Přihlas se
        </Link>
      </p>
    </div>
  );
}
