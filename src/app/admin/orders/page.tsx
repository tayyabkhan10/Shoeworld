// 'use client';
// import { useState } from "react";
// import { format, isValid } from "date-fns";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   useListAllOrders,
//   getListAllOrdersQueryKey,
//   useUpdateOrderStatus,
//   getDashboardStatsQueryKey,
//   getRecentOrdersQueryKey,
//   type OrderStatusUpdateStatus,
// } from "@/hooks/api";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Trash2, Download } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { AdminLayout } from "@/components/admin/AdminLayout";
// import { formatPKR } from "@/lib/pkr";
// import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
// import { downloadOrderInvoice } from "@/lib/invoice"; // ← import

// // ── Inline delete hook ───────────────────────────────────────
// async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
//   const res = await fetch(url, {
//     ...options,
//     headers: { "Content-Type": "application/json", ...options?.headers },
//     credentials: "include",
//   });
//   if (!res.ok) {
//     const msg = await res.text().catch(() => res.statusText);
//     throw new Error(msg || `API error ${res.status}`);
//   }
//   if (res.status === 204) return null as T;
//   return res.json() as Promise<T>;
// }

// function useDeleteOrder(
//   options?: UseMutationOptions<null, Error, number>
// ) {
//   return useMutation<null, Error, number>({
//     mutationFn: (id) => apiFetch(`/api/admin/orders/${id}`, { method: "DELETE" }),
//     ...options,
//   });
// }

// // ── Safe date formatter ──────────────────────────────────────
// function safeFormat(dateStr: string | null | undefined, fmt: string): string {
//   if (!dateStr) return "N/A";
//   const d = new Date(dateStr);
//   return isValid(d) ? format(d, fmt) : "N/A";
// }

// // ── Status colors ────────────────────────────────────────────
// const statusColors: Record<string, string> = {
//   pending:    "bg-amber-100 text-amber-700 border-amber-200",
//   processing: "bg-blue-100 text-blue-700 border-blue-200",
//   shipped:    "bg-purple-100 text-purple-700 border-purple-200",
//   delivered:  "bg-green-100 text-green-700 border-green-200",
//   cancelled:  "bg-red-100 text-red-700 border-red-200",
// };

// // ── Main Component ───────────────────────────────────────────
// export default function AdminOrders() {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const { data: orders, isLoading } = useListAllOrders();

//   const { mutate: updateStatus } = useUpdateOrderStatus({
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
//       queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
//       queryClient.invalidateQueries({ queryKey: getRecentOrdersQueryKey() });
//       toast({ title: "Order status updated" });
//     },
//     onError: () =>
//       toast({ title: "Failed to update status", variant: "destructive" }),
//   });

//   const { mutate: deleteOrder } = useDeleteOrder({
//     onMutate: () => setIsDeleting(true),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
//       queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
//       toast({ title: "Order deleted successfully" });
//       setDeleteOrderId(null);
//       setIsDeleting(false);
//     },
//     onError: () => {
//       toast({ title: "Failed to delete order", variant: "destructive" });
//       setIsDeleting(false);
//     },
//   });

//   const handleDeleteConfirm = () => {
//     if (deleteOrderId !== null) deleteOrder(deleteOrderId);
//   };

//   // ── Invoice download handler ─────────────────────────────
//   const handleDownloadInvoice = (order: NonNullable<typeof orders>[number]) => {
//     try {
//       downloadOrderInvoice({
//         id: order.id,
//         createdAt: order.createdAt,
//         status: order.status,
//         total: order.total ?? 0,
//         userEmail: order.userEmail ?? undefined,
//         customerPhone: order.customerPhone ?? undefined,
//         paymentMethod: (order as any).paymentMethod ?? (order as any).payment_method,
//         shippingAddress: (order.shippingAddress as Record<string, string | undefined>) ?? {},
//         items: Array.isArray(order.items) ? order.items : [],
//       });
//       toast({ title: `Invoice #${order.id} downloaded` });
//     } catch (err) {
//       toast({ title: "Failed to generate invoice", variant: "destructive" });
//     }
//   };

//   return (
//     <AdminLayout>
//       <div className="max-w-7xl mx-auto">

//         {/* ── Header ── */}
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {orders?.length ?? 0} total orders
//           </p>
//         </div>

//         {/* ── Loading ── */}
//         {isLoading ? (
//           <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />
//         ) : (
//           <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-gray-50 border-b border-gray-200">
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Order</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Date</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Customer</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Shipping Address</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Items</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Total</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[160px]">Update</TableHead>
//                   {/* ← 2 action columns */}
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[40px]"></TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[40px]"></TableHead>
//                 </TableRow>
//               </TableHeader>

//               <TableBody>
//                 {(orders ?? []).map((order) => {
//                   const addr = order.shippingAddress as Record<string, string | undefined>;
//                   const items = Array.isArray(order.items) ? order.items : [];

//                   const fullAddress = [
//                     addr?.line1,
//                     addr?.line2,
//                     addr?.city,
//                     addr?.state,
//                     addr?.zip,
//                   ].filter(Boolean).join(", ");

//                   const paymentMethod = order?.paymentMethod ?? (order as any)?.payment_method;
//                   const paymentLabel =
//                     paymentMethod === "cod"    ? "Cash on Delivery" :
//                     paymentMethod === "online" ? "Online Payment"   : "N/A";

//                   return (
//                     <TableRow
//                       key={order.id}
//                       className="hover:bg-gray-50 transition-colors border-b border-gray-100"
//                     >
//                       {/* Order ID */}
//                       <TableCell>
//                         <span className="font-semibold text-gray-900 text-sm">
//                           #{order.id}
//                         </span>
//                       </TableCell>

//                       {/* Date */}
//                       <TableCell className="text-sm text-gray-600">
//                         {safeFormat(order.createdAt, "MMM d, yyyy")}
//                       </TableCell>

//                       {/* Customer */}
//                       <TableCell>
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">
//                             {addr?.fullName || "N/A"}
//                           </p>
//                           <p className="text-xs text-gray-400">{order.userEmail}</p>
//                         </div>
//                       </TableCell>

//                       {/* Shipping Address */}
//                       <TableCell className="max-w-[240px]">
//                         <div className="text-sm text-gray-600">
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <button className="text-left w-full text-blue-600 hover:underline cursor-pointer focus:outline-none">
//                                 <p className="truncate">{fullAddress || "N/A"}</p>
//                               </button>
//                             </PopoverTrigger>
//                             <PopoverContent className="w-80 space-y-2">
//                               <div className="font-semibold text-gray-900">Full Address</div>
//                               <div className="space-y-1 text-sm text-gray-700">
//                                 {addr?.line1 && <p>{addr.line1}</p>}
//                                 {addr?.line2 && <p className="text-gray-500">{addr.line2}</p>}
//                                 <p className="font-medium">
//                                   {[addr?.city, addr?.state, addr?.zip].filter(Boolean).join(", ")}
//                                 </p>
//                               </div>
//                               <div className="border-t pt-2 text-sm">
//                                 <span className="text-gray-500">Phone: </span>
//                                 <span className="font-medium">{order.customerPhone || "N/A"}</span>
//                               </div>
//                               <div className="text-sm">
//                                 <span className="text-gray-500">Payment: </span>
//                                 <span className="font-medium">{paymentLabel}</span>
//                               </div>
//                             </PopoverContent>
//                           </Popover>
//                         </div>
//                       </TableCell>

//                       {/* Items */}
//                       <TableCell>
//                         <div className="flex -space-x-2">
//                           {items.slice(0, 3).map((item, i) => (
//                             <div
//                               key={i}
//                               className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shrink-0"
//                             >
//                               {item?.productImageUrl ? (
//                                 <img
//                                   src={item.productImageUrl}
//                                   alt={item?.productName ?? ""}
//                                   className="h-full w-full object-cover"
//                                 />
//                               ) : (
//                                 <div className="h-full w-full bg-gray-200" />
//                               )}
//                             </div>
//                           ))}
//                           {items.length > 3 && (
//                             <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
//                               +{items.length - 3}
//                             </div>
//                           )}
//                           {items.length === 0 && (
//                             <span className="text-xs text-gray-400">—</span>
//                           )}
//                         </div>
//                       </TableCell>

//                       {/* Total */}
//                       <TableCell>
//                         <span className="font-semibold text-sm text-gray-900">
//                           {formatPKR(order.total ?? 0)}
//                         </span>
//                       </TableCell>

//                       {/* Status Badge */}
//                       <TableCell>
//                         <Badge
//                           variant="outline"
//                           className={`text-xs capitalize ${statusColors[order.status] ?? ""}`}
//                         >
//                           {order.status}
//                         </Badge>
//                       </TableCell>

//                       {/* Status Update */}
//                       <TableCell>
//                         <Select
//                           key={`${order.id}-${order.status}`}
//                           defaultValue={order.status}
//                           onValueChange={(v) =>
//                             updateStatus({ id: order.id, status: v as OrderStatusUpdateStatus })
//                           }
//                         >
//                           <SelectTrigger className="h-8 text-xs border-gray-200">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="pending">Pending</SelectItem>
//                             <SelectItem value="processing">Processing</SelectItem>
//                             <SelectItem value="shipped">Shipped</SelectItem>
//                             <SelectItem value="delivered">Delivered</SelectItem>
//                             <SelectItem value="cancelled">Cancelled</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </TableCell>

//                       {/* ── Download Invoice Button ── */}
//                       <TableCell>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
//                           onClick={() => handleDownloadInvoice(order)}
//                           title="Download Invoice"
//                         >
//                           <Download className="h-4 w-4" />
//                         </Button>
//                       </TableCell>

//                       {/* ── Delete Button ── */}
//                       <TableCell>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
//                           onClick={() => setDeleteOrderId(order.id)}
//                           title="Delete Order"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}

//                 {(!orders || orders.length === 0) && (
//                   <TableRow>
//                     <TableCell colSpan={10} className="text-center py-12 text-gray-400">
//                       No orders yet.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>

//       {/* ── Delete Confirmation Dialog ── */}
//       <AlertDialog
//         open={deleteOrderId !== null}
//         onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}
//       >
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Order delete karein?</AlertDialogTitle>
//             <AlertDialogDescription>
//               Order <span className="font-semibold text-gray-900">#{deleteOrderId}</span> permanently
//               delete ?
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDeleteConfirm}
//               disabled={isDeleting}
//               className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
//             >
//               {isDeleting ? "Deleting..." : "Delete Order"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </AdminLayout>
//   );
// }



'use client';
import { useState, useRef, useEffect, useMemo } from "react";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListAllOrders,
  getListAllOrdersQueryKey,
  useUpdateOrderStatus,
  getDashboardStatsQueryKey,
  getRecentOrdersQueryKey,
  type OrderStatusUpdateStatus,
} from "@/hooks/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPKR } from "@/lib/pkr";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { downloadOrderInvoice } from "@/lib/invoice";
import {
  Trash2, Download, ChevronRight, Package,
  MapPin, Phone, CreditCard, Clock, CheckCircle2,
  Truck, XCircle, Loader2, ShoppingBag, ArrowUpDown, Check,
  Search, Copy, FileDown, TrendingUp, X, CheckSquare, Square,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Signal White tokens — same as AdminProducts
   ───────────────────────────────────────────────────────────── */

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `API error ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

function useDeleteOrder(options?: UseMutationOptions<null, Error, number>) {
  return useMutation<null, Error, number>({
    mutationFn: (id) => apiFetch(`/api/admin/orders/${id}`, { method: "DELETE" }),
    ...options,
  });
}

function safeFormat(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "N/A";
}

function safeDistanceToNow(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "";
}

// ── Types ────────────────────────────────────────────────────
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; icon: React.ElementType;
  bg: string; text: string; dot: string; border: string;
}> = {
  pending:    { label: "Pending",    icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400",  border: "border-amber-200" },
  processing: { label: "Processing", icon: Loader2,      bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400",   border: "border-blue-200" },
  shipped:    { label: "Shipped",    icon: Truck,        bg: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-400", border: "border-violet-200" },
  delivered:  { label: "Delivered",  icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500",border: "border-emerald-200" },
  cancelled:  { label: "Cancelled",  icon: XCircle,      bg: "bg-red-50",     text: "text-red-600",    dot: "bg-red-400",    border: "border-red-200" },
};

const STATUS_LIST: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

type SortKey = "newest" | "oldest" | "total-asc" | "total-desc" | "status";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Newest first" },
  { value: "oldest",     label: "Oldest first" },
  { value: "total-desc", label: "Total ↓" },
  { value: "total-asc",  label: "Total ↑" },
  { value: "status",     label: "By status" },
];

type OrderItem = {
  productName?: string; productImageUrl?: string;
  quantity?: number; price?: number; size?: string; color?: string;
};
type Order = {
  id: number; createdAt: string; status: string;
  total?: number | null; userEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: Record<string, string | undefined> | null;
  items?: OrderItem[]; paymentMethod?: string;
};

// ── Copy to clipboard helper ─────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  return { copy, copied };
}

// ── StatusBadge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as OrderStatus];
  if (!cfg) return <span className="text-xs text-[#6b7280] capitalize">{status}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

// ── Inline StatusSelect (used right in summary row) ──────────
function StatusSelect({ value, onChange, stopClick }: {
  value: string;
  onChange: (v: OrderStatus) => void;
  stopClick?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[value as OrderStatus];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setFlipLeft(window.innerWidth - rect.right < 200);
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
          cfg ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "bg-[#f4f4f5] text-[#6b7280] border-[#e5e7eb]"
        }`}
        title="Click to change status"
      >
        {cfg && (() => { const Icon = cfg.icon; return <Icon className={`w-3 h-3 ${value === "processing" ? "animate-spin" : ""}`} />; })()}
        {cfg?.label ?? value}
        <ChevronRight className={`w-3 h-3 opacity-50 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: flipLeft ? 6 : -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: flipLeft ? 6 : -6, scale: 0.95 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className={`absolute top-0 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-1 z-50 w-48 ${
              flipLeft ? "right-full mr-2" : "left-full ml-2"
            }`}
          >
            <div className={`absolute top-2.5 w-2 h-2 bg-white border rotate-45 z-[-1] ${
              flipLeft ? "right-[-5px] border-t-0 border-l-0 border-[#e5e7eb]" : "left-[-5px] border-b-0 border-r-0 border-[#e5e7eb]"
            }`} />
            <p className="px-3 pb-1.5 pt-1.5 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f4f4f5] mb-1">
              Change status
            </p>
            {STATUS_LIST.map((s) => {
              const c = STATUS_CONFIG[s];
              const Icon = c.icon;
              const isActive = value === s;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-xs transition-colors hover:bg-[#f4f4f5] ${
                    isActive ? "font-semibold text-[#0a0a0a]" : "text-[#6b7280]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                      <Icon className={`w-3 h-3 ${c.text}`} />
                    </span>
                    {c.label}
                  </span>
                  {isActive && <Check className="w-3 h-3 text-[#0a0a0a] flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Order age indicator ───────────────────────────────────────
function OrderAge({ createdAt, status }: { createdAt: string; status: string }) {
  const hours = useMemo(() => {
    const d = new Date(createdAt);
    return isValid(d) ? (Date.now() - d.getTime()) / 3_600_000 : 0;
  }, [createdAt]);

  // Only show urgency for non-terminal statuses
  if (status === "delivered" || status === "cancelled") return null;
  if (hours < 24) return null; // Less than 1 day — no warning

  const urgent = hours > 72;
  return (
    <span className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      urgent ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {urgent ? "Overdue" : "Aging"}
    </span>
  );
}

// ── OrderRow ─────────────────────────────────────────────────
function OrderRow({
  order, onDelete, onStatusChange, onDownload, index, selected, onSelect,
}: {
  order: Order; onDelete: (id: number) => void;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onDownload: (order: Order) => void;
  index: number; selected: boolean; onSelect: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { copy, copied } = useCopy();
  const addr = (order.shippingAddress ?? {}) as Record<string, string | undefined>;
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const paymentMethod = (order as any).paymentMethod ?? (order as any).payment_method;
  const paymentLabel =
    paymentMethod === "cod" ? "Cash on Delivery" :
    paymentMethod === "online" ? "Online Payment" : "N/A";
  const fullAddress = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ") || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.035, ease: "easeOut" }}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-visible ${
        selected
          ? "border-[#0a0a0a] shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
          : expanded
          ? "border-[#0a0a0a]/15 shadow-[0_8px_40px_rgba(0,0,0,0.07)]"
          : "border-[#e5e7eb] hover:border-[#0a0a0a]/12 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
      }`}
    >
      {/* ── Summary row ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-3.5">

        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(order.id); }}
          className="flex-shrink-0 text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
        >
          {selected
            ? <CheckSquare className="w-4 h-4 text-[#0a0a0a]" />
            : <Square className="w-4 h-4" />
          }
        </button>

        {/* Clickable area to expand */}
        <button
          className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Order ID + date */}
          <div className="flex-shrink-0 w-20 sm:w-24">
            <p className="text-[13px] font-bold text-[#0a0a0a]">#{order.id}</p>
            <p className="text-[10px] text-[#6b7280] mt-0.5">{safeFormat(order.createdAt, "MMM d, yyyy")}</p>
          </div>

          {/* Customer */}
          <div className="min-w-0 flex-1 hidden sm:block">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[#0a0a0a] truncate">{addr.fullName || "N/A"}</p>
              <OrderAge createdAt={order.createdAt} status={order.status} />
            </div>
            <p className="text-[11px] text-[#6b7280] truncate">{order.userEmail || "—"}</p>
          </div>

          {/* Item thumbnails */}
          <div className="hidden md:flex items-center -space-x-2 flex-shrink-0">
            {items.slice(0, 4).map((item, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-[#f4f4f5] overflow-hidden flex-shrink-0 shadow-sm">
                {item.productImageUrl
                  ? <img src={item.productImageUrl} alt={item.productName ?? ""} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-[#e5e7eb] flex items-center justify-center"><Package className="w-3 h-3 text-[#6b7280]" /></div>}
              </div>
            ))}
            {items.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#f4f4f5] flex items-center justify-center text-[10px] font-bold text-[#6b7280] flex-shrink-0">
                +{items.length - 4}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex-shrink-0 text-right hidden sm:block w-24">
            <p className="text-[14px] font-bold text-[#0a0a0a]">{formatPKR(order.total ?? 0)}</p>
            <p className="text-[10px] text-[#6b7280]">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </button>

        {/* Status — directly in row, clickable */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <StatusSelect
            value={order.status}
            onChange={(v) => onStatusChange(order.id, v)}
          />
        </div>

        {/* Expand chevron */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#f4f4f5] transition-colors"
        >
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <ChevronRight className="w-4 h-4 text-[#6b7280]" />
          </motion.div>
        </button>
      </div>

      {/* ── Expanded detail panel ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-[#f4f4f5] px-4 py-4 sm:px-5 sm:py-5 space-y-4">

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Customer */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-semibold text-[#0a0a0a]">{addr.fullName || "N/A"}</p>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
                    <span className="text-xs text-[#6b7280]">{order.customerPhone || "N/A"}</span>
                    {order.customerPhone && (
                      <button
                        onClick={() => copy(order.customerPhone!, `phone-${order.id}`)}
                        className="text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
                        title="Copy phone"
                      >
                        {copied === `phone-${order.id}`
                          ? <Check className="w-3 h-3 text-emerald-500" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7280] truncate">{order.userEmail || "—"}</p>
                  <p className="text-[10px] text-[#6b7280]">{safeDistanceToNow(order.createdAt)}</p>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Ship to</p>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#6b7280]" />
                    <div className="text-xs text-[#0a0a0a] leading-relaxed flex-1 min-w-0">
                      {addr.line1 && <p>{addr.line1}</p>}
                      {addr.line2 && <p className="text-[#6b7280]">{addr.line2}</p>}
                      <p>{[addr.city, addr.state, addr.zip].filter(Boolean).join(", ") || "N/A"}</p>
                    </div>
                    {fullAddress && (
                      <button
                        onClick={() => copy(fullAddress, `addr-${order.id}`)}
                        className="text-[#6b7280] hover:text-[#0a0a0a] transition-colors flex-shrink-0"
                        title="Copy address"
                      >
                        {copied === `addr-${order.id}`
                          ? <Check className="w-3 h-3 text-emerald-500" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Payment</p>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-[#6b7280]" />
                    <span className="text-xs font-medium text-[#0a0a0a]">{paymentLabel}</span>
                  </div>
                  <p className="text-[10px] text-[#6b7280]">
                    {safeFormat(order.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Items */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Items</p>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.15 }}
                        className="flex items-center gap-3 rounded-xl border border-[#f4f4f5] bg-[#fafafa] px-3 py-2.5"
                      >
                        <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white overflow-hidden flex-shrink-0">
                          {item.productImageUrl
                            ? <img src={item.productImageUrl} alt={item.productName ?? ""} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-3.5 h-3.5 text-[#d1d5db]" /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-[#0a0a0a] truncate">{item.productName ?? "Product"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {item.size && <span className="text-[10px] text-[#6b7280] bg-white border border-[#e5e7eb] rounded-full px-1.5 py-0.5">Size {item.size}</span>}
                            {item.color && <span className="text-[10px] text-[#6b7280] bg-white border border-[#e5e7eb] rounded-full px-1.5 py-0.5">{item.color}</span>}
                            <span className="text-[10px] text-[#6b7280]">× {item.quantity ?? 1}</span>
                          </div>
                        </div>
                        <p className="text-[12px] font-bold text-[#0a0a0a] flex-shrink-0">
                          {formatPKR((item.price ?? 0) * (item.quantity ?? 1))}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-3 pt-0.5">
                    <span className="text-xs text-[#6b7280]">Order total</span>
                    <span className="text-[15px] font-bold text-[#0a0a0a]">{formatPKR(order.total ?? 0)}</span>
                  </div>
                </div>
              )}

              {/* Action bar — download + delete only (status is in row now) */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f4f4f5]">
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(order); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280] border border-[#e5e7eb] rounded-xl px-3 py-1.5 hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Invoice
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef4444] border border-[#fecaca] rounded-xl px-3 py-1.5 hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stats bar ────────────────────────────────────────────────
function StatsBar({ orders, onFilterClick }: { orders: Order[]; onFilterClick: (s: OrderStatus | "all") => void }) {
  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const totalRevenue = useMemo(
    () => orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total ?? 0), 0),
    [orders]
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
      {/* Revenue card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="col-span-2 sm:col-span-3 lg:col-span-1 bg-black rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer"
        onClick={() => onFilterClick("delivered")}>
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 ">
          <p className="text-[13px] font-bold text-white leading-tight truncate">{formatPKR(totalRevenue)}</p>
          <p className="text-[10px] text-white/50 mt-0.5">Revenue</p>
        </div>
      </motion.div>

      {STATUS_LIST.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.05, duration: 0.2 }}
            className="bg-white rounded-2xl border border-[#e5e7eb] px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:border-[#0a0a0a]/15 hover:shadow-sm transition-all"
            onClick={() => onFilterClick(s)}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon className={`w-4 h-4 ${cfg.text} ${s === "processing" && counts[s] > 0 ? "animate-spin" : ""}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[18px] font-bold text-[#0a0a0a] leading-none">{counts[s]}</p>
              <p className="text-[10px] text-[#6b7280] mt-0.5 truncate">{cfg.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────
function exportCSV(orders: Order[]) {
  const headers = ["Order ID", "Date", "Customer", "Email", "Phone", "Address", "Items", "Total", "Status", "Payment"];
  const rows = orders.map(o => {
    const addr = (o.shippingAddress ?? {}) as Record<string, string | undefined>;
    const items = Array.isArray(o.items) ? o.items : [];
    const pm = (o as any).paymentMethod ?? (o as any).payment_method;
    return [
      `#${o.id}`,
      safeFormat(o.createdAt, "yyyy-MM-dd"),
      addr.fullName ?? "",
      o.userEmail ?? "",
      o.customerPhone ?? "",
      [addr.line1, addr.city, addr.state].filter(Boolean).join(", "),
      items.length,
      o.total ?? 0,
      o.status,
      pm === "cod" ? "Cash on Delivery" : pm === "online" ? "Online" : "",
    ].map(v => `"${v}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────
export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);

  const { data: rawOrders, isLoading } = useListAllOrders();
  const orders: Order[] = (rawOrders ?? []) as Order[];

  const { mutate: updateStatus } = useUpdateOrderStatus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getRecentOrdersQueryKey() });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const { mutate: deleteOrder } = useDeleteOrder({
    onMutate: () => setIsDeleting(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      toast({ title: "Order deleted" });
      setDeleteOrderId(null);
      setIsDeleting(false);
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
      setIsDeleting(false);
    },
  });

  // Close bulk menu on outside click
  useEffect(() => {
    if (!showBulkMenu) return;
    const h = (e: MouseEvent) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setShowBulkMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showBulkMenu]);

  const handleDownloadInvoice = (order: Order) => {
    try {
      const invoiceItems = Array.isArray(order.items)
        ? order.items.map((item) => ({
            ...item,
            productName: item.productName ?? "Product",
            quantity: item.quantity ?? 0,
            price: item.price ?? 0,
          }))
        : [];

      downloadOrderInvoice({
        id: order.id, createdAt: order.createdAt, status: order.status,
        total: order.total ?? 0, userEmail: order.userEmail ?? undefined,
        customerPhone: order.customerPhone ?? undefined,
        paymentMethod: (order as any).paymentMethod ?? (order as any).payment_method,
        shippingAddress: (order.shippingAddress as Record<string, string | undefined>) ?? {},
        items: invoiceItems,
      });
      toast({ title: `Invoice #${order.id} downloaded` });
    } catch {
      toast({ title: "Failed to generate invoice", variant: "destructive" });
    }
  };

  // Filter + search + sort
  const processed = useMemo(() => {
    let list = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => {
        const addr = (o.shippingAddress ?? {}) as Record<string, string | undefined>;
        return (
          String(o.id).includes(q) ||
          (addr.fullName ?? "").toLowerCase().includes(q) ||
          (o.userEmail ?? "").toLowerCase().includes(q) ||
          (o.customerPhone ?? "").includes(q)
        );
      });
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "oldest":     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "total-desc": return (b.total ?? 0) - (a.total ?? 0);
        case "total-asc":  return (a.total ?? 0) - (b.total ?? 0);
        case "status":     return (a.status ?? "").localeCompare(b.status ?? "");
        default:           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [orders, filterStatus, search, sortBy]);

  const allSelected = processed.length > 0 && processed.every(o => selectedIds.has(o.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(processed.map(o => o.id)));
  };
  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkUpdateStatus = (status: OrderStatus) => {
    selectedIds.forEach(id => updateStatus({ id, status: status as OrderStatusUpdateStatus }));
    setSelectedIds(new Set());
    setShowBulkMenu(false);
    toast({ title: `${selectedIds.size} orders updated to ${STATUS_CONFIG[status].label}` });
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Sort";

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#fafafa] -m-4 sm:-m-6 p-4 sm:p-6">

        {/* ── Header ── */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280] mb-3 uppercase tracking-widest">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0a0a0a]">Orders</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">Orders</h1>
              <p className="text-sm text-[#6b7280] mt-1">{orders.length} total · {processed.length} shown</p>
            </div>
            {/* ── Feature 3: CSV Export ── */}
            <button
              onClick={() => { exportCSV(processed); toast({ title: `Exported ${processed.length} orders` }); }}
              className="self-start sm:self-auto inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 hover:border-[#0a0a0a]/20 hover:text-[#0a0a0a] transition-colors"
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        {/* ── Stats bar (clickable to filter) ── */}
        {!isLoading && orders.length > 0 && (
          <StatsBar orders={orders} onFilterClick={setFilterStatus} />
        )}

        {/* ── Toolbar ── */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-3 mb-4">
            {/* ── Feature 1: Search bar ── */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search by name, email, phone, order #…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0a0a0a] placeholder-[#6b7280] outline-none focus:border-[#0a0a0a]/30 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Status filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    filterStatus === "all" ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0a0a0a]/20"
                  }`}
                >All</button>
                {STATUS_LIST.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                        filterStatus === s ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#0a0a0a]/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${filterStatus === s ? "bg-white" : cfg.dot}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* ── Feature 2: Bulk actions ── */}
                <AnimatePresence>
                  {selectedIds.size > 0 && (
                    <motion.div
                      ref={bulkRef}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="relative"
                    >
                      <button
                        onClick={() => setShowBulkMenu(!showBulkMenu)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#0a0a0a] rounded-xl px-3.5 py-2"
                      >
                        {selectedIds.size} selected
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showBulkMenu ? "rotate-90" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {showBulkMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-1.5 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-1 z-40 w-52"
                          >
                            <p className="px-3.5 py-2 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider border-b border-[#f4f4f5]">
                              Bulk update {selectedIds.size} orders
                            </p>
                            {STATUS_LIST.map(s => {
                              const c = STATUS_CONFIG[s];
                              const Icon = c.icon;
                              return (
                                <button key={s} onClick={() => bulkUpdateStatus(s)}
                                  className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 text-xs text-[#6b7280] hover:bg-[#f4f4f5] hover:text-[#0a0a0a] transition-colors"
                                >
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center ${c.bg}`}>
                                    <Icon className={`w-3 h-3 ${c.text}`} />
                                  </span>
                                  Mark as {c.label}
                                </button>
                              );
                            })}
                            <div className="border-t border-[#f4f4f5] mt-1 pt-1">
                              <button
                                onClick={() => setSelectedIds(new Set())}
                                className="w-full text-left px-3.5 py-2 text-xs text-[#6b7280] hover:bg-[#f4f4f5] transition-colors"
                              >
                                Clear selection
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
                    onContextMenu={(e) => { e.preventDefault(); setShowSortMenu(!showSortMenu); }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#0a0a0a] bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 hover:border-[#0a0a0a]/20 transition-colors"
                    title="Left-click to toggle newest/oldest, right-click for more options"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#6b7280]" />
                    {currentSortLabel}
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1.5 bg-white border border-[#e5e7eb] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-1 z-30 min-w-[170px]"
                      >
                        {SORT_OPTIONS.map(opt => (
                          <button key={opt.value}
                            onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                            className="w-full flex items-center justify-between gap-3 text-left px-3.5 py-2 text-sm text-[#0a0a0a] hover:bg-[#f4f4f5] transition-colors"
                          >
                            {opt.label}
                            {sortBy === opt.value && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Select-all bar ── */}
        {!isLoading && processed.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
              {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-[#0a0a0a]" /> : <Square className="w-3.5 h-3.5" />}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
        )}

        {/* ── Body ── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] h-[60px] animate-pulse" />
            ))}
          </div>
        ) : processed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#e5e7eb] py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#f4f4f5] flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-[#d1d5db]" />
            </div>
            <p className="text-[15px] font-semibold text-[#0a0a0a]">
              {search ? "No orders match your search" : filterStatus === "all" ? "No orders yet" : `No ${STATUS_CONFIG[filterStatus as OrderStatus]?.label.toLowerCase()} orders`}
            </p>
            <p className="text-sm text-[#6b7280] mt-1">
              {search ? "Try a different keyword." : filterStatus === "all" ? "Orders will appear here once customers check out." : "Try a different filter."}
            </p>
            {(search || filterStatus !== "all") && (
              <button onClick={() => { setSearch(""); setFilterStatus("all"); }}
                className="mt-4 text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {processed.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                index={i}
                selected={selectedIds.has(order.id)}
                onSelect={toggleOne}
                onDelete={setDeleteOrderId}
                onStatusChange={(id, status) => updateStatus({ id, status: status as OrderStatusUpdateStatus })}
                onDownload={handleDownloadInvoice}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      <AlertDialog
        open={deleteOrderId !== null}
        onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}
      >
        <AlertDialogContent className="rounded-2xl border border-[#e5e7eb]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0a0a0a] font-bold">Delete order #{deleteOrderId}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b7280]">
              This action cannot be undone. The order will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-[#e5e7eb]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId !== null && deleteOrder(deleteOrderId)}
              disabled={isDeleting}
              className="rounded-xl bg-[#ef4444] hover:bg-[#dc2626]"
            >
              {isDeleting
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</span>
                : "Delete order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}