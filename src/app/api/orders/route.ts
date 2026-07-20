import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/mailer";

const FREE_SHIPPING_THRESHOLD = 28000;
const SHIPPING_COST = 300;

async function buildOrderResponse(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    id: order.id,
    userId: order.userId,
    userEmail: order.userEmail,
    status: order.status,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImageUrl: i.productImageUrl,
      price: Number(i.price),
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    shippingAddress: order.shippingAddress,
    customerPhone: order.customerPhone,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userOrders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, session.user.id))
      .orderBy(desc(ordersTable.createdAt));

    const results = await Promise.all(userOrders.map((o) => buildOrderResponse(o.id)));
    return NextResponse.json(results.filter(Boolean));
  } catch (err) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const ShippingAddress = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3),
  country: z.string().min(2),
});

const CreateOrderBody = z.object({
  shippingAddress: ShippingAddress,
  customerPhone: z.string().min(11),
  paymentMethod: z.enum(["cod", "online"]),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const toEmail = session.user.email ?? undefined;
    const toName = session.user.name ?? toEmail ?? "Customer";

    const body = await request.json();
    const { shippingAddress, customerPhone, paymentMethod } = CreateOrderBody.parse(body);

    const cartItems = await db
      .select({
        id: cartItemsTable.id,
        productId: cartItemsTable.productId,
        productName: productsTable.name,
        productImageUrl: productsTable.imageUrl,
        price: cartItemsTable.price,
        quantity: cartItemsTable.quantity,
        size: cartItemsTable.size,
        color: cartItemsTable.color,
      })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.userId, userId));

    if (!cartItems.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId,
        userEmail: toEmail,
        status: "pending",
        subtotal: String(subtotal.toFixed(2)),
        shippingCost: String(shippingCost.toFixed(2)),
        total: String(total.toFixed(2)),
        shippingAddress,
        customerPhone,
        paymentMethod,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      cartItems.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        productName: i.productName,
        productImageUrl: i.productImageUrl,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      }))
    );

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    const result = await buildOrderResponse(order.id);

    // Email send karo (non-blocking)
    if (toEmail) {
      sendOrderConfirmation({
        orderId: order.id,
        toEmail,
        toName,
        items: cartItems.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          price: Number(i.price),
          size: i.size,
          color: i.color,
        })),
        subtotal,
        shippingCost,
        total,
        shippingAddress,
      }).catch((e) => console.warn("Email send failed:", e));
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}