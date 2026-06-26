// 📁 src/app/api/dashboard/products-rank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productsTable, orderItemsTable, ordersTable } from "@/lib/schema";
import { eq, ne, sql, sum } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db.select().from(productsTable);

    // Aggregate sold units / revenue per product, ignoring cancelled orders.
    const salesRows = await db
      .select({
        productId: orderItemsTable.productId,
        unitsSold: sum(orderItemsTable.quantity).as("unitsSold"),
        revenue: sql<string>`sum(${orderItemsTable.quantity} * ${orderItemsTable.price})`.as("revenue"),
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
      .where(ne(ordersTable.status, "cancelled"))
      .groupBy(orderItemsTable.productId);

    const salesMap = new Map(
      salesRows.map((r) => [
        r.productId,
        { unitsSold: Number(r.unitsSold ?? 0), revenue: Number(r.revenue ?? 0) },
      ])
    );

    const ranked = products
      .map((p) => {
        const s = salesMap.get(p.id);
        return {
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          category: p.category,
          price: Number(p.price),
          inStock: p.inStock,
          stockCount: p.stockCount,
          unitsSold: s?.unitsSold ?? 0,
          revenue: s?.revenue ?? 0,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    return NextResponse.json({
      products: ranked,
      totalProducts: ranked.length,
      totalUnitsSold: ranked.reduce((s, p) => s + p.unitsSold, 0),
    });
  } catch (err) {
    console.error("[dashboard/products-rank]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}