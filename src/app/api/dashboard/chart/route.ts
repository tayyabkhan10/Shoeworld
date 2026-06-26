// 📁 src/app/api/dashboard/chart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ordersTable } from "@/lib/schema";
import { eq, and, gte, lt, sum, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "1M"; // "1D" | "7D" | "1M" | "1Y"

  try {
    const now = new Date();
    type ChartPoint = { label: string; revenue: number; orders: number };
    const points: ChartPoint[] = [];

    if (period === "1D") {
      // Last 12 hours in 2-hour buckets
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now);
        from.setHours(now.getHours() - i * 2, 0, 0, 0);
        const to = new Date(from);
        to.setHours(from.getHours() + 2, 0, 0, 0);

        const label =
          from.getHours() === 0
            ? "12am"
            : from.getHours() < 12
            ? `${from.getHours()}am`
            : from.getHours() === 12
            ? "12pm"
            : `${from.getHours() - 12}pm`;

        const [rev] = await db
          .select({ total: sum(ordersTable.total) })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.status, "delivered"),
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );
        const [ord] = await db
          .select({ total: count() })
          .from(ordersTable)
          .where(
            and(
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );

        points.push({
          label,
          revenue: Number(rev.total ?? 0),
          orders: Number(ord.total ?? 0),
        });
      }
    } else if (period === "7D") {
      // Last 7 days
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const from = new Date(now);
        from.setDate(now.getDate() - i);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setDate(from.getDate() + 1);

        const [rev] = await db
          .select({ total: sum(ordersTable.total) })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.status, "delivered"),
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );
        const [ord] = await db
          .select({ total: count() })
          .from(ordersTable)
          .where(
            and(
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );

        points.push({
          label: days[from.getDay()],
          revenue: Number(rev.total ?? 0),
          orders: Number(ord.total ?? 0),
        });
      }
    } else if (period === "1M") {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const from = new Date(now);
        from.setDate(now.getDate() - i * 7 - 6);
        from.setHours(0, 0, 0, 0);
        const to = new Date(now);
        to.setDate(now.getDate() - i * 7 + 1);
        to.setHours(0, 0, 0, 0);

        const [rev] = await db
          .select({ total: sum(ordersTable.total) })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.status, "delivered"),
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );
        const [ord] = await db
          .select({ total: count() })
          .from(ordersTable)
          .where(
            and(
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );

        points.push({
          label: `Week ${4 - i}`,
          revenue: Number(rev.total ?? 0),
          orders: Number(ord.total ?? 0),
        });
      }
    } else if (period === "1Y") {
      // Last 12 months
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [rev] = await db
          .select({ total: sum(ordersTable.total) })
          .from(ordersTable)
          .where(
            and(
              eq(ordersTable.status, "delivered"),
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );
        const [ord] = await db
          .select({ total: count() })
          .from(ordersTable)
          .where(
            and(
              gte(ordersTable.createdAt, from),
              lt(ordersTable.createdAt, to)
            )
          );

        points.push({
          label: months[from.getMonth()],
          revenue: Number(rev.total ?? 0),
          orders: Number(ord.total ?? 0),
        });
      }
    }

    // Growth: compare last point vs second-last point
    const len = points.length;
    const last = points[len - 1]?.revenue ?? 0;
    const prev = points[len - 2]?.revenue ?? 0;
    const growth = prev === 0 ? 100 : parseFloat((((last - prev) / prev) * 100).toFixed(1));

    return NextResponse.json({
      labels: points.map((p) => p.label),
      revenue: points.map((p) => p.revenue),
      orders: points.map((p) => p.orders),
      totalRevenue: points.reduce((s, p) => s + p.revenue, 0),
      totalOrders: points.reduce((s, p) => s + p.orders, 0),
      growth,
    });
  } catch (err) {
    console.error("[dashboard/chart]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}