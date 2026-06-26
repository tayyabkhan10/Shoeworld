// 📁 src/app/admin/page.tsx
'use client';

import Link from "next/link";
import {
  useGetDashboardStats,
  useGetTopProducts,
  useGetRecentOrders,
} from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatPKR } from "@/lib/pkr";
import { Orbitron } from "next/font/google";
import DashboardAnalytics from "@/components/admin/DashboardAnalytics";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
});

const statusColors: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped:    "bg-purple-100 text-purple-700 border-purple-200",
  delivered:  "bg-green-100 text-green-700 border-green-200",
  cancelled:  "bg-red-100 text-red-700 border-red-200",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: topProducts, isLoading: isTopLoading } = useGetTopProducts();
  const { data: recentOrders, isLoading: isOrdersLoading } = useGetRecentOrders();

  const isLoading = isStatsLoading || isTopLoading || isOrdersLoading;

  // Stat card config — all values from real API
  const statCards = stats
    ? [
        {
          title:     "Total Revenue",
          value:     formatPKR(stats.totalRevenue),
          icon:      Banknote,
          growth:    stats.revenueGrowth,
          sub:       "vs last month",
          accent:    "#7C3AED",
          iconBg:    "bg-violet-50",
          iconColor: "text-violet-600",
          gradFrom:  "from-violet-50",
        },
        {
          title:     "Total Orders",
          value:     stats.totalOrders.toLocaleString(),
          icon:      ShoppingCart,
          growth:    stats.ordersGrowth,
          sub:       `${stats.pendingOrders} pending`,
          accent:    "#059669",
          iconBg:    "bg-emerald-50",
          iconColor: "text-emerald-600",
          gradFrom:  "from-emerald-50",
        },
        {
          title:     "Products",
          value:     stats.totalProducts.toLocaleString(),
          icon:      Package,
          growth:    undefined,
          sub:       "in catalog",
          accent:    "#0EA5E9",
          iconBg:    "bg-sky-50",
          iconColor: "text-sky-600",
          gradFrom:  "from-sky-50",
        },
        {
          title:     "Customers",
          value:     stats.totalCustomers.toLocaleString(),
          icon:      Users,
          growth:    undefined,
          sub:       "registered",
          accent:    "#F59E0B",
          iconBg:    "bg-amber-50",
          iconColor: "text-amber-600",
          gradFrom:  "from-amber-50",
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-1 sm:px-0">

        {/* ── Header ── */}
        <div className="mb-7">
          <h1 className={`${orbitron.className} text-xl sm:text-2xl font-bold text-gray-900 tracking-widest`}>
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Welcome back, Admin. Here's what's happening today.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        {isStatsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradFrom} to-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300`}
              >
                {/* Accent glow dot */}
                <div
                  className="absolute top-3 right-3 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: card.accent,
                    boxShadow: `0 0 8px 2px ${card.accent}66`,
                  }}
                />

                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                  <card.icon className={`h-[18px] w-[18px] ${card.iconColor}`} />
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums leading-tight">
                  {card.value}
                </p>

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {card.growth !== undefined && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{
                        color:           card.growth >= 0 ? "#059669" : "#DC2626",
                        backgroundColor: card.growth >= 0 ? "#D1FAE5" : "#FEE2E2",
                      }}
                    >
                      {card.growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(card.growth).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">{card.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Revenue Chart (real-time, fetches own data) ── */}
        <div className="mb-6">
           <DashboardAnalytics />
        </div>

        {/* ── Tables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Orders */}
          <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50">
              <CardTitle className="text-sm font-semibold text-gray-900">Recent Orders</CardTitle>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {isOrdersLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders?.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-violet-50/40 transition-colors"
                    >
                      <div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-violet-700 transition-colors"
                        >
                          #{order.id}
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {format(new Date(order.createdAt), "MMM d, yyyy")} · {order.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize border ${statusColors[order.status] ?? ""}`}
                        >
                          {order.status}
                        </Badge>
                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                          {formatPKR(order.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-50">
              <CardTitle className="text-sm font-semibold text-gray-900">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isTopLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topProducts?.slice(0, 5).map((product, idx) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-violet-50/40 transition-colors"
                    >
                      <span className="text-[10px] font-bold text-gray-300 w-4 shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="h-10 w-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                        <p className="text-[11px] text-gray-400">{product.totalSold} sold</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                        {formatPKR(product.revenue)}
                      </span>
                    </div>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-8">No sales data yet</p>
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