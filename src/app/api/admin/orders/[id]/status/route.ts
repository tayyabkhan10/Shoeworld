// 📁 src/app/api/admin/orders/[id]/status/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ordersTable, orderItemsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = typeof VALID_STATUSES[number];

async function buildOrderResponse(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    items,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = Number(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // 🔐 Safe JSON parsing
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    console.log("📦 PATCH Payload Received:", body); // 🔍 Debug ke liye

    const { status } = body;
    if (!status) {
      return NextResponse.json(
        { error: "Status is required", receivedBody: body },
        { status: 400 }
      );
    }

    // ✅ Auto-lowercase & trim to avoid casing/spacing issues
    const normalizedStatus = String(status).toLowerCase().trim();
    if (!VALID_STATUSES.includes(normalizedStatus as OrderStatus)) {
      return NextResponse.json(
        { error: "Invalid status", received: status, validOptions: VALID_STATUSES },
        { status: 400 }
      );
    }

    // ✅ Check order exists
    const [existingOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ Update status
    const [updatedOrder] = await db
      .update(ordersTable)
      .set({
        status: normalizedStatus as OrderStatus,
        updatedAt: new Date(), // Remove if column doesn't exist
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    const orderWithItems = await buildOrderResponse(orderId);
    return NextResponse.json(orderWithItems, { status: 200 });

  } catch (error) {
    console.error("[admin/orders/[id]/status PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


