// 📁 src/components/admin/UsersChart.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getCached, setCached } from "@/lib/dashboardCache";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Period = "1D" | "7D" | "1M" | "1Y";

interface RecentUser {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

interface UsersChartData {
  labels: string[];
  users: number[];
  totalUsers: number;
  growth: number;
  recentUsers: RecentUser[];
}

const PERIODS: Period[] = ["1D", "7D", "1M", "1Y"];
const DEFAULT_PERIOD: Period = "1M";
const cacheKey = (p: Period) => `users:${p}`;

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function UsersChart() {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [data, setData] = useState<UsersChartData | null>(() => getCached<UsersChartData>(cacheKey(DEFAULT_PERIOD)));
  const [loading, setLoading] = useState<boolean>(() => !getCached<UsersChartData>(cacheKey(DEFAULT_PERIOD)));
  const abortRef = useRef<AbortController | null>(null);
  const didInitRef = useRef(false);

  const fetchData = useCallback(async (p: Period) => {
    const cached = getCached<UsersChartData>(cacheKey(p));
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/dashboard/users-chart?period=${p}`, {
        signal: abortRef.current.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const json: UsersChartData = await res.json();
      setCached(cacheKey(p), json);
      setData(json);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (data) return;
    }
    fetchData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      PERIODS.filter((p) => p !== period && !getCached<UsersChartData>(cacheKey(p))).forEach((p) => {
        fetch(`/api/dashboard/users-chart?period=${p}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((json: UsersChartData) => setCached(cacheKey(p), json))
          .catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "rgba(79,70,229,0.15)",
        borderWidth: 1,
        titleColor: "#4338CA",
        bodyColor: "#374151",
        padding: 12,
        cornerRadius: 12,
        titleFont: { weight: 600, size: 12 },
        bodyFont: { size: 12 },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `  New users: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9CA3AF", font: { size: 11, family: "Inter, sans-serif" }, maxRotation: 0 },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)", drawTicks: false },
        border: { display: false },
        ticks: { color: "#9CA3AF", font: { size: 10, family: "Inter, sans-serif" }, precision: 0, maxTicksLimit: 5 },
      },
    },
  };

  const isPositive = (data?.growth ?? 0) >= 0;

  return (
    <div
      className="rounded-3xl overflow-hidden bg-white border border-gray-100 transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_40px_rgba(79,70,229,0.09),0_4px_12px_rgba(0,0,0,0.04)]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(79,70,229,0.06), 0 2px 8px rgba(0,0,0,0.03)" }}
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #4F46E5 0%, #818CF8 50%, #F59E0B 100%)" }} />

      <div className="px-4 sm:px-6 pt-5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-400">Customer Growth</p>

            <div className="flex items-baseline gap-3 flex-wrap">
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                  {data?.totalUsers.toLocaleString() ?? "—"}
                </span>
              )}
              {!loading && data && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{
                    color: isPositive ? "#059669" : "#DC2626",
                    backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2",
                    border: `1px solid ${isPositive ? "#A7F3D0" : "#FECACA"}`,
                  }}
                >
                  {isPositive ? "▲" : "▼"} {Math.abs(data.growth)}%
                  <span className="font-normal text-gray-400 ml-0.5">vs prev</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Registered customers — admin accounts excluded</p>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-2xl self-start sm:self-center overflow-x-auto max-w-full"
            style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                disabled={loading}
                className="px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 disabled:opacity-60 shrink-0"
                style={
                  period === p
                    ? { background: "linear-gradient(135deg,#4F46E5,#4338CA)", color: "#fff", boxShadow: "0 2px 10px rgba(79,70,229,0.35)" }
                    : { background: "transparent", color: "#9CA3AF" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-5 h-[170px] sm:h-[200px]">
        {loading || !data ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-end gap-2 h-24">
              {[55, 70, 40, 85, 60, 95, 50, 78, 65, 90, 58, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg animate-pulse"
                  style={{ height: `${h}%`, background: i % 2 === 0 ? "rgba(79,70,229,0.08)" : "rgba(79,70,229,0.05)", animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-300 font-medium">Loading chart…</p>
          </div>
        ) : (
          <Bar
            data={{
              labels: data.labels,
              datasets: [
                {
                  label: "New users",
                  data: data.users,
                  backgroundColor: "rgba(79,70,229,0.85)",
                  hoverBackgroundColor: "#4338CA",
                  borderRadius: 8,
                  maxBarThickness: 34,
                },
              ],
            }}
            options={chartOptions}
          />
        )}
      </div>

      {/* ── Recent customers avatar strip (Cloudinary) ── */}
      {!loading && data && data.recentUsers.length > 0 && (
        <div className="border-t border-gray-50 px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
            Newest
          </span>
          <div className="flex items-center -space-x-2.5 overflow-x-auto py-1">
            {data.recentUsers.map((u) =>
              u.image ? (
                <img
                  key={u.id}
                  src={u.image}
                  alt={u.name ?? "User"}
                  title={u.name ?? "User"}
                  className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm hover:z-10 hover:scale-110 transition-transform duration-200 shrink-0"
                />
              ) : (
                <div
                  key={u.id}
                  title={u.name ?? "User"}
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-400 to-indigo-600 hover:z-10 hover:scale-110 transition-transform duration-200 shrink-0"
                >
                  {initials(u.name)}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}