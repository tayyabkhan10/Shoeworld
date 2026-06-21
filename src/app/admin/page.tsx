'use client';
import Link from "next/link"; 
import {
  useGetDashboardStats,
  useGetTopProducts,
  useGetRecentOrders,
} from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, Banknote, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPKR } from "@/lib/pkr";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
});


const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: topProducts, isLoading: isTopLoading } = useGetTopProducts();
  const { data: recentOrders, isLoading: isOrdersLoading } = useGetRecentOrders();

  const isLoading = isStatsLoading || isTopLoading || isOrdersLoading;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${orbitron.className} tracking-widest  text-2xl font-bold text-gray-900`}>Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              {
                title: "Total Revenue",
                value: formatPKR(stats.totalRevenue),
                icon: Banknote,
                growth: stats.revenueGrowth,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                title: "Total Orders",
                value: stats.totalOrders.toString(),
                icon: ShoppingCart,
                growth: stats.ordersGrowth,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                sub: `${stats.pendingOrders} pending`,
              },
              {
                title: "Products",
                value: stats.totalProducts.toString(),
                icon: Package,
                iconBg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
              {
                title: "Customers",
                value: stats.totalCustomers.toString(),
                icon: Users,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
              },
            ].map((card) => (
              <Card key={card.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    {card.growth !== undefined && (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        card.growth >= 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {card.growth >= 0
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(card.growth).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{card.sub ?? card.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Recent Orders</CardTitle>
              <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {isOrdersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-gray-900 hover:underline">
                          #{order.id}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(order.createdAt), "MMM d, yyyy")} · {order.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-xs capitalize ${statusColors[order.status] ?? ""}`}>
                          {order.status}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatPKR(order.total)}</span>
                      </div>
                    </div>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {isTopLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts?.slice(0, 5).map((product, idx) => (
                    <div key={product.productId} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{idx + 1}</span>
                      <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                        <p className="text-xs text-gray-500">{product.totalSold} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        {formatPKR(product.revenue)}
                      </span>
                    </div>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-6">No sales data yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
