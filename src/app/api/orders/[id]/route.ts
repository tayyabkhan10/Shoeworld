


// 📁 src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, ordersTable, orderItemsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // apna auth path check karo

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Order fetch karo
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ Security: sirf apna order dekh sake (admin bypass)
    const isAdmin = session.user.role === "admin";
    if (!isAdmin && order[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Order items fetch karo
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));

    // Response banao — numeric fields ko number mein convert karo
    const result = {
      ...order[0],
      subtotal: parseFloat(order[0].subtotal),
      shippingCost: parseFloat(order[0].shippingCost),
      total: parseFloat(order[0].total),
      items: items.map((item) => ({
        ...item,
        price: parseFloat(item.price),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Sirf admin delete kar sake
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const existing = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // order_items cascade delete honge automatically (schema mein onDelete: "cascade" hai)
    await db.delete(ordersTable).where(eq(ordersTable.id, orderId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}