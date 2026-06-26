// 📁 src/components/admin/DashboardAnalytics.tsx
'use client';

import { useState } from "react";
import { LineChart, Users2, Package } from "lucide-react";
import RevenueChart from "./RevenueChart";
import UsersChart from "./UsersChart";
import ProductsRankSlider from "./ProductsRankSlider";

type Tab = "revenue" | "users" | "products";

const TABS: { id: Tab; label: string; icon: typeof LineChart; accent: string }[] = [
  { id: "revenue", label: "Revenue", icon: LineChart, accent: "#7C3AED" },
  { id: "users", label: "Users", icon: Users2, accent: "#4F46E5" },
  { id: "products", label: "Products", icon: Package, accent: "#059669" },
];

export default function DashboardAnalytics() {
  const [tab, setTab] = useState<Tab>("revenue");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      {/* ── Tab switcher ── */}
      <div
        className="inline-flex items-center gap-1 p-1.5 rounded-2xl mb-4 bg-white border border-gray-100"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        {TABS.map((t) => {
          const isActive = t.id === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
                      color: "#fff",
                      boxShadow: `0 4px 14px ${t.accent}55`,
                    }
                  : { background: "transparent", color: "#9CA3AF" }
              }
            >
              <Icon size={15} />
              <span className="hidden xs:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active widget — keyed so it remounts with a soft fade, no full data reload thanks to dashboardCache ── */}
      <div key={tab} className="animate-[dashFadeIn_320ms_ease-out]">
        {tab === "revenue" && <RevenueChart />}
        {tab === "users" && <UsersChart />}
        {tab === "products" && <ProductsRankSlider />}
      </div>

      <style>{`
        @keyframes dashFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[dashFadeIn_320ms_ease-out\\] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}