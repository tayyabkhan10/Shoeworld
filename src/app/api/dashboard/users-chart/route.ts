// 📁 src/app/api/dashboard/users-chart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { and, count, desc, gte, lt, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "1M"; // "1D" | "7D" | "1M" | "1Y"

  try {
    const now = new Date();
    type ChartPoint = { label: string; users: number };
    const points: ChartPoint[] = [];

    const notAdmin = ne(usersTable.role, "admin");

    if (period === "1D") {
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now);
        from.setHours(now.getHours() - i * 2, 0, 0, 0);
        const to = new Date(from);
        to.setHours(from.getHours() + 2, 0, 0, 0);

        const label =
          from.getHours() === 0 ? "12am" : from.getHours() < 12 ? `${from.getHours()}am` : from.getHours() === 12 ? "12pm" : `${from.getHours() - 12}pm`;

        const [row] = await db
          .select({ total: count() })
          .from(usersTable)
          .where(and(notAdmin, gte(usersTable.createdAt, from), lt(usersTable.createdAt, to)));

        points.push({ label, users: Number(row.total ?? 0) });
      }
    } else if (period === "7D") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const from = new Date(now);
        from.setDate(now.getDate() - i);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setDate(from.getDate() + 1);

        const [row] = await db
          .select({ total: count() })
          .from(usersTable)
          .where(and(notAdmin, gte(usersTable.createdAt, from), lt(usersTable.createdAt, to)));

        points.push({ label: days[from.getDay()], users: Number(row.total ?? 0) });
      }
    } else if (period === "1M") {
      for (let i = 3; i >= 0; i--) {
        const from = new Date(now);
        from.setDate(now.getDate() - i * 7 - 6);
        from.setHours(0, 0, 0, 0);
        const to = new Date(now);
        to.setDate(now.getDate() - i * 7 + 1);
        to.setHours(0, 0, 0, 0);

        const [row] = await db
          .select({ total: count() })
          .from(usersTable)
          .where(and(notAdmin, gte(usersTable.createdAt, from), lt(usersTable.createdAt, to)));

        points.push({ label: `Week ${4 - i}`, users: Number(row.total ?? 0) });
      }
    } else if (period === "1Y") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [row] = await db
          .select({ total: count() })
          .from(usersTable)
          .where(and(notAdmin, gte(usersTable.createdAt, from), lt(usersTable.createdAt, to)));

        points.push({ label: months[from.getMonth()], users: Number(row.total ?? 0) });
      }
    }

    const [totalRow] = await db.select({ total: count() }).from(usersTable).where(notAdmin);
    const totalUsers = Number(totalRow.total ?? 0);

    const recentUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        image: usersTable.image,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(notAdmin)
      .orderBy(desc(usersTable.createdAt))
      .limit(8);

    const len = points.length;
    const last = points[len - 1]?.users ?? 0;
    const prev = points[len - 2]?.users ?? 0;
    const growth = prev === 0 ? (last > 0 ? 100 : 0) : parseFloat((((last - prev) / prev) * 100).toFixed(1));

    return NextResponse.json({
      labels: points.map((p) => p.label),
      users: points.map((p) => p.users),
      totalUsers,
      growth,
      recentUsers,
    });
  } catch (err) {
    console.error("[dashboard/users-chart]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}