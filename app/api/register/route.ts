import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { findUserByNameCaseInsensitive } from "@/lib/userLookup";

/**
 * Self-registration endpoint. Creates a new MEMBER user.
 * Body: { name: string; password: string; confirmPassword: string }
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!name) {
    return NextResponse.json({ error: "Zadej jméno." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Heslo musí mít alespoň 6 znaků." },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Hesla se neshodují." },
      { status: 400 }
    );
  }

  const existing = await findUserByNameCaseInsensitive(name);
  if (existing) {
    return NextResponse.json(
      { error: "Toto jméno je již zabrané. Zvol prosím jiné." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      passwordHash,
      role: "MEMBER",
    },
  });

  return NextResponse.json({ id: user.id, name: user.name });
}
