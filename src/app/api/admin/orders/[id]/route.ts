// 📁 src/app/api/admin/orders/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ordersTable, orderItemsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function DELETE(
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

    // Pehle order items delete karo (foreign key ki wajah se)
    await db.delete(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

    // Phir order delete karo
    const [deleted] = await db
      .delete(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });

  } catch (error) {
    console.error("[admin/orders/[id] DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}