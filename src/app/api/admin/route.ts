// 📁 src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { desc } from "drizzle-orm";

const ADMIN_EMAIL = "soft-chappal@gmail.com";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin" || session.user.email === ADMIN_EMAIL;
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        emailVerified: usersTable.emailVerified,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}