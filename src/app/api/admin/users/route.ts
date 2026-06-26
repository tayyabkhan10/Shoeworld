// // 📁 src/app/api/admin/users/route.ts
// import { NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
// import { db } from "@/lib/db";
// import { usersTable } from "@/lib/schema";
// import { desc } from "drizzle-orm";

// export async function GET() {
//   const session = await auth();
//   if (!session || (session.user as any).role !== "admin") {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const allUsers = await db
//       .select({
//         id: usersTable.id,
//         name: usersTable.name,
//         email: usersTable.email,
//         role: usersTable.role,
//         emailVerified: usersTable.emailVerified,
//         createdAt: usersTable.createdAt,
//         updatedAt: usersTable.updatedAt,
//       })
//       .from(usersTable)
//       .orderBy(desc(usersTable.createdAt));

//     return NextResponse.json(allUsers);
//   } catch (error) {
//     console.error("[admin/users]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// 📁 src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usersTable, sessionsTable, accountsTable } from "@/lib/schema";
import { desc, eq, gt, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Subquery: latest non-expired session expiry per user (real "online" signal).
    // A row here means NextAuth has an active session for that user right now.
    const activeSessions = db
      .select({
        userId: sessionsTable.userId,
        latestExpiry: sql<string>`max(${sessionsTable.expires})`.as("latest_expiry"),
        sessionCount: sql<number>`count(*)`.as("session_count"),
      })
      .from(sessionsTable)
      .where(gt(sessionsTable.expires, now))
      .groupBy(sessionsTable.userId)
      .as("active_sessions");

    // Subquery: linked OAuth providers per user (for "Sign-in method" detail).
    const providerAgg = db
      .select({
        userId: accountsTable.userId,
        providers: sql<string>`string_agg(distinct ${accountsTable.provider}, ',')`.as(
          "providers"
        ),
      })
      .from(accountsTable)
      .groupBy(accountsTable.userId)
      .as("provider_agg");

    const allUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        image: usersTable.image,
        role: usersTable.role,
        emailVerified: usersTable.emailVerified,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        hasPassword: sql<boolean>`(${usersTable.password} is not null)`,
        // Real-time signal: a row in active_sessions means a live, non-expired session exists.
        isOnline: sql<boolean>`(${activeSessions.userId} is not null)`,
        sessionExpiresAt: activeSessions.latestExpiry,
        activeSessionCount: sql<number>`coalesce(${activeSessions.sessionCount}, 0)`,
        providers: providerAgg.providers,
      })
      .from(usersTable)
      .leftJoin(activeSessions, eq(activeSessions.userId, usersTable.id))
      .leftJoin(providerAgg, eq(providerAgg.userId, usersTable.id))
      .orderBy(desc(usersTable.createdAt));

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("[admin/users]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}