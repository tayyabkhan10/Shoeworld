// 📁 src/app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ordersTable, orderItemsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));

    // Har order ke saath uske items attach karo
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));

        return {
          ...order,
          total: Number(order.total),
          items,
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error("[admin/orders GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Status update
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/orders PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

