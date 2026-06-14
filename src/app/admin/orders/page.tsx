// 'use client';
// import { format } from "date-fns";
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
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { AdminLayout } from "@/components/admin/AdminLayout";
// import { formatPKR } from "@/lib/pkr";

// const statusColors: Record<string, string> = {
//   pending: "bg-amber-100 text-amber-700 border-amber-200",
//   processing: "bg-blue-100 text-blue-700 border-blue-200",
//   shipped: "bg-purple-100 text-purple-700 border-purple-200",
//   delivered: "bg-green-100 text-green-700 border-green-200",
//   cancelled: "bg-red-100 text-red-700 border-red-200",
// };

// export default function AdminOrders() {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const { data: orders, isLoading } = useListAllOrders();

//   const { mutate: updateStatus } = useUpdateOrderStatus({
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
//       queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
//       queryClient.invalidateQueries({ queryKey: getRecentOrdersQueryKey() });
//       toast({ title: "Order status updated" });
//     },
//     onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
//   });

//   return (
//     <AdminLayout>
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {orders?.length ?? 0} total orders
//           </p>
//         </div>

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
//                   {/* 👇 Naya Shipping Address Column */}
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Shipping Address</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Items</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Total</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status</TableHead>
//                   <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[160px]">Update</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {orders?.map((order) => {
//                   // 👇 JSONB ko type-cast kar lein taake TS error na aaye
//                   const addr = order.shippingAddress as Record<string, string | undefined>;

//                   return (
//                     <TableRow key={order.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
//                       <TableCell>
//                         <span className="font-semibold text-gray-900 text-sm">#{order.id}</span>
//                       </TableCell>
//                       <TableCell className="text-sm text-gray-600">
//                         {format(new Date(order.createdAt), "MMM d, yyyy")}
//                       </TableCell>
//                       <TableCell>
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">{addr.fullName || "N/A"}</p>
//                           <p className="text-xs text-gray-400">{order.userEmail}</p>
//                         </div>
//                       </TableCell>

//                       {/* 👇 Updated Address + Phone Cell */}
//                       <TableCell className="max-w-[240px]">
//                         {(() => {
//                           const addr = order.shippingAddress as any;
//                           const fullAddress = [
//                             addr.line1,
//                             addr.line2,
//                             addr.city,
//                             addr.state,
//                             addr.zip,
//                           ].filter(Boolean).join(", ");

//                           return (
//                             <div className="text-sm text-gray-600">
//                               <Popover>
//                                 <PopoverTrigger asChild>
//                                   <button className="text-left w-full text-blue-600 hover:underline cursor-pointer focus:outline-none">
//                                     <p className="truncate">{fullAddress || "N/A"}</p>
//                                   </button>
//                                 </PopoverTrigger>
//                                 <PopoverContent className="w-80 space-y-2">
//                                   <div className="font-semibold text-gray-900">Full Address</div>
//                                   <div className="space-y-1 text-sm text-gray-700">
//                                     {addr.line1 && <p>{addr.line1}</p>}
//                                     {addr.line2 && <p className="text-gray-500">{addr.line2}</p>}
//                                     <p className="font-medium">
//                                       {[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
//                                     </p>
//                                   </div>
//                                   <div className="border-t pt-2 text-sm">
//                                     <span className="text-gray-500">Phone: </span>
//                                     <span className="font-medium">{order.customerPhone || "N/A"}</span>
//                                   </div>
//                                   <div>
//                                     {(() => {
//                                       const pm = order?.paymentMethod ?? (order as any)?.payment_method;
//                                       return pm === "cod" ? "Cash on Delivery" : pm === "online" ? "Online Payment" : "N/A";
//                                     })()}
//                                   </div>
//                                 </PopoverContent>
//                               </Popover>
//                             </div>
//                           );
//                         })()}
//                       </TableCell>

//                       <TableCell>
//                         <div className="flex -space-x-2">
//                           {order.items.slice(0, 3).map((item, i) => (
//                             <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shrink-0">
//                               <img src={item.productImageUrl} alt={item.productName} className="h-full w-full object-cover" />
//                             </div>
//                           ))}
//                           {order.items.length > 3 && (
//                             <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
//                               +{order.items.length - 3}
//                             </div>
//                           )}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <span className="font-semibold text-sm text-gray-900">{formatPKR(order.total)}</span>
//                       </TableCell>
//                       <TableCell>
//                         <Badge variant="outline" className={`text-xs capitalize ${statusColors[order.status] ?? ""}`}>
//                           {order.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <Select
//                           key={`${order.id}-${order.status}`}
//                           defaultValue={order.status}
//                           onValueChange={(v) => updateStatus({ id: order.id, status: v as OrderStatusUpdateStatus })}
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
//                     </TableRow>
//                   );
//                 })}
//                 {(!orders || orders.length === 0) && (
//                   <TableRow>
//                     {/* 👇 colSpan 7 se 8 kar diya gaya hai kyunki naya column add hua hai */}
//                     <TableCell colSpan={8} className="text-center py-12 text-gray-400">
//                       No orders yet.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>
//     </AdminLayout>
//   );
// }


'use client';
import { useState } from "react";
import { format, isValid } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAllOrders,
  getListAllOrdersQueryKey,
  useUpdateOrderStatus,
  getDashboardStatsQueryKey,
  getRecentOrdersQueryKey,
  type OrderStatusUpdateStatus,
} from "@/hooks/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPKR } from "@/lib/pkr";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

// ── Inline delete hook (jab tak api.ts mein add na karo) ────
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

function useDeleteOrder(
  options?: UseMutationOptions<null, Error, number>
) {
  return useMutation<null, Error, number>({
    mutationFn: (id) => apiFetch(`/api/admin/orders/${id}`, { method: "DELETE" }),
    ...options,
  });
}

// ── Safe date formatter ──────────────────────────────────────
function safeFormat(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "N/A";
}

// ── Status colors ────────────────────────────────────────────
const statusColors: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped:    "bg-purple-100 text-purple-700 border-purple-200",
  delivered:  "bg-green-100 text-green-700 border-green-200",
  cancelled:  "bg-red-100 text-red-700 border-red-200",
};

// ── Main Component ───────────────────────────────────────────
export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete confirmation state
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: orders, isLoading } = useListAllOrders();

  const { mutate: updateStatus } = useUpdateOrderStatus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getRecentOrdersQueryKey() });
      toast({ title: "Order status updated" });
    },
    onError: () =>
      toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const { mutate: deleteOrder } = useDeleteOrder({
    onMutate: () => setIsDeleting(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getDashboardStatsQueryKey() });
      toast({ title: "Order deleted successfully" });
      setDeleteOrderId(null);
      setIsDeleting(false);
    },
    onError: () => {
      toast({ title: "Failed to delete order", variant: "destructive" });
      setIsDeleting(false);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteOrderId !== null) {
      deleteOrder(deleteOrderId);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders?.length ?? 0} total orders
          </p>
        </div>

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Order</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Customer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Shipping Address</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Items</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Total</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[160px]">Update</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-gray-500 w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(orders ?? []).map((order) => {
                  const addr = order.shippingAddress as Record<string, string | undefined>;
                  const items = Array.isArray(order.items) ? order.items : [];

                  const fullAddress = [
                    addr?.line1,
                    addr?.line2,
                    addr?.city,
                    addr?.state,
                    addr?.zip,
                  ].filter(Boolean).join(", ");

                  const paymentMethod = order?.paymentMethod ?? (order as any)?.payment_method;
                  const paymentLabel =
                    paymentMethod === "cod"    ? "Cash on Delivery" :
                    paymentMethod === "online" ? "Online Payment"   : "N/A";

                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      {/* Order ID */}
                      <TableCell>
                        <span className="font-semibold text-gray-900 text-sm">
                          #{order.id}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-gray-600">
                        {safeFormat(order.createdAt, "MMM d, yyyy")}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {addr?.fullName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">{order.userEmail}</p>
                        </div>
                      </TableCell>

                      {/* Shipping Address */}
                      <TableCell className="max-w-[240px]">
                        <div className="text-sm text-gray-600">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-left w-full text-blue-600 hover:underline cursor-pointer focus:outline-none">
                                <p className="truncate">{fullAddress || "N/A"}</p>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 space-y-2">
                              <div className="font-semibold text-gray-900">Full Address</div>
                              <div className="space-y-1 text-sm text-gray-700">
                                {addr?.line1 && <p>{addr.line1}</p>}
                                {addr?.line2 && <p className="text-gray-500">{addr.line2}</p>}
                                <p className="font-medium">
                                  {[addr?.city, addr?.state, addr?.zip].filter(Boolean).join(", ")}
                                </p>
                              </div>
                              <div className="border-t pt-2 text-sm">
                                <span className="text-gray-500">Phone: </span>
                                <span className="font-medium">{order.customerPhone || "N/A"}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Payment: </span>
                                <span className="font-medium">{paymentLabel}</span>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>

                      {/* Items */}
                      <TableCell>
                        <div className="flex -space-x-2">
                          {items.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shrink-0"
                            >
                              {item?.productImageUrl ? (
                                <img
                                  src={item.productImageUrl}
                                  alt={item?.productName ?? ""}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-200" />
                              )}
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                              +{items.length - 3}
                            </div>
                          )}
                          {items.length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell>
                        <span className="font-semibold text-sm text-gray-900">
                          {formatPKR(order.total ?? 0)}
                        </span>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${statusColors[order.status] ?? ""}`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>

                      {/* Status Update */}
                      <TableCell>
                        <Select
                          key={`${order.id}-${order.status}`}
                          defaultValue={order.status}
                          onValueChange={(v) =>
                            updateStatus({ id: order.id, status: v as OrderStatusUpdateStatus })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Delete Button */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteOrderId(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Empty state */}
                {(!orders || orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={deleteOrderId !== null}
        onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Order delete karein?</AlertDialogTitle>
            <AlertDialogDescription>
              Order <span className="font-semibold text-gray-900">#{deleteOrderId}</span> permanently
              delete ho jayega. Yeh action undo nahi ho sakta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}