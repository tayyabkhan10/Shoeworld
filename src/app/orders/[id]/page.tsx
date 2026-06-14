'use client';

import Link from "next/link";
import { use } from "react";
import { format, isValid } from "date-fns";
import { useGetOrder } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, MapPin, ShoppingBag } from "lucide-react";
import { formatPKR } from "@/lib/pkr";

// ── Safe date formatter ──────────────────────────────────────
function safeFormat(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "N/A";
}

// ── Status helpers ───────────────────────────────────────────
function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
    case "processing":
      return <Package className="h-5 w-5 text-blue-500" />;
    case "shipped":
      return <Truck className="h-5 w-5 text-purple-500" />;
    case "delivered":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "cancelled":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Package className="h-5 w-5" />;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "pending":    return "Order is pending confirmation";
    case "processing": return "We're preparing your order";
    case "shipped":    return "Your order is on the way";
    case "delivered":  return "Your order has been delivered";
    case "cancelled":  return "This order was cancelled";
    default:           return status ?? "Unknown";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":    return "bg-yellow-50 border-yellow-200";
    case "processing": return "bg-blue-50 border-blue-200";
    case "shipped":    return "bg-purple-50 border-purple-200";
    case "delivered":  return "bg-green-50 border-green-200";
    case "cancelled":  return "bg-red-50 border-red-200";
    default:           return "bg-muted/30 border";
  }
}

// ── Main Component ───────────────────────────────────────────
export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);
  const id = parseInt(orderId || "0", 10);

  const { data: order, isLoading, error } = useGetOrder(id);

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-12 bg-muted rounded w-64" />
          <div className="h-24 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-muted rounded" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-40 bg-muted rounded" />
              <div className="h-40 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / Not Found ────────────────────────────────────
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-8">
          We couldn't find this order. It may have been removed or you may not have access.
        </p>
        <Link href="/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  // ── Safe data extraction ─────────────────────────────────
  const items = Array.isArray(order.items) ? order.items : [];
  const shippingAddress = order.shippingAddress ?? null;
  const subtotal = order.subtotal ?? 0;
  const shippingCost = order.shippingCost ?? 0;
  const total = order.total ?? 0;
  const status = order.status ?? "pending";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">

      {/* ── Back link ── */}
      <div className="mb-8">
        <Link
          href="/orders"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Orders
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Order</p>
          <h1 className="text-3xl font-serif font-bold">#{order.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {safeFormat(order.createdAt, "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit px-4 py-1.5 text-xs uppercase tracking-widest font-semibold"
        >
          {status}
        </Badge>
      </div>

      {/* ── Status Banner ── */}
      <div className={`border p-5 mb-10 flex items-center gap-4 rounded-sm ${getStatusColor(status)}`}>
        <div className="p-2.5 bg-white border shadow-sm rounded-sm shrink-0">
          {getStatusIcon(status)}
        </div>
        <div>
          <p className="font-semibold">{getStatusText(status)}</p>
          {order.updatedAt && status !== "pending" && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Last updated {safeFormat(order.updatedAt, "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* ── Body Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* ── Items ── */}
        <div className="md:col-span-2">
          <h2 className="text-xs font-semibold mb-5 uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5" />
            Items Ordered ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No items found in this order.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item?.id ?? index}
                  className="flex gap-4 p-4 border bg-card hover:bg-muted/20 transition-colors"
                >
                  {/* Image */}
                  <div className="w-20 h-24 shrink-0 bg-muted overflow-hidden">
                    {item?.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item?.productName ?? "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <Link
                        href={`/product/${item?.productId ?? ""}`}
                        className="font-semibold hover:underline line-clamp-1 text-sm"
                      >
                        {item?.productName ?? "Unknown Product"}
                      </Link>
                      <span className="font-semibold text-sm shrink-0">
                        {formatPKR((item?.price ?? 0) * (item?.quantity ?? 1))}
                      </span>
                    </div>

                    {(item?.color || item?.size) && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {[item?.color, item?.size ? `Size ${item.size}` : null]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      Qty: {item?.quantity ?? 1} × {formatPKR(item?.price ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Order Summary */}
          <div className="bg-muted/30 p-6 border">
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-widest text-muted-foreground">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingCost === 0 ? "Free" : formatPKR(shippingCost)}</span>
              </div>
              {order.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatPKR(total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-muted/30 p-6 border">
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Shipping Address
            </h2>

            {!shippingAddress ? (
              <p className="text-sm text-muted-foreground">No shipping address available.</p>
            ) : (
              <address className="not-italic text-sm text-muted-foreground space-y-1 leading-relaxed">
                {shippingAddress.fullName && (
                  <p className="font-medium text-foreground">{shippingAddress.fullName}</p>
                )}
                {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                {(shippingAddress.city || shippingAddress.state || shippingAddress.zip) && (
                  <p>
                    {[shippingAddress.city, shippingAddress.state, shippingAddress.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {shippingAddress.country && <p>{shippingAddress.country}</p>}
              </address>
            )}
          </div>

          {/* Customer Phone (if available) */}
          {order.customerPhone && (
            <div className="bg-muted/30 p-6 border">
              <h2 className="text-xs font-semibold mb-2 uppercase tracking-widest text-muted-foreground">
                Contact
              </h2>
              <p className="text-sm">{order.customerPhone}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}