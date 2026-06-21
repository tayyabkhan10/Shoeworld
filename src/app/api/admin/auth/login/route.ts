// 📁 src/app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "soft-chappal@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email aur password required hain" },
        { status: 400 }
      );
    }

    // ── Sirf admin email allow karo ────────────────────────
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // ── DB se user fetch karo ──────────────────────────────
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ── Password check karo ────────────────────────────────
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ── Role fix karo agar admin nahi ─────────────────────
    if (user.role !== "admin") {
      await db
        .update(usersTable)
        .set({ role: "admin" })
        .where(eq(usersTable.id, user.id));
    }

    // ── Admin JWT token banao ──────────────────────────────
    const token = await createAdminToken({
      id: user.id,
      email: user.email!,
      role: "admin",
    });

    // ── Cookie set karo ───────────────────────────────────
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 ghante
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Server error. Try again." },
      { status: 500 }
    );
  }
}