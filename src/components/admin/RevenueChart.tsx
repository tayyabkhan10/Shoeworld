
// 📁 src/components/admin/RevenueChart.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getCached, setCached } from "@/lib/dashboardCache";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Period = "1D" | "7D" | "1M" | "1Y";

interface ChartData {
  labels: string[];
  revenue: number[];
  orders: number[];
  totalRevenue: number;
  totalOrders: number;
  growth: number;
}

const PERIODS: Period[] = ["1D", "7D", "1M", "1Y"];
const DEFAULT_PERIOD: Period = "1M";
const cacheKey = (p: Period) => `revenue:${p}`;

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [data, setData] = useState<ChartData | null>(() => getCached<ChartData>(cacheKey(DEFAULT_PERIOD)));
  const [loading, setLoading] = useState<boolean>(() => !getCached<ChartData>(cacheKey(DEFAULT_PERIOD)));
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const didInitRef = useRef(false);

  const fetchData = useCallback(async (p: Period) => {
    const cached = getCached<ChartData>(cacheKey(p));
    if (cached) {
      setData(cached);
      setLoading(false);
      setTick((t) => t + 1);
      return;
    }
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/dashboard/chart?period=${p}`, {
        signal: abortRef.current.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const json: ChartData = await res.json();
      setCached(cacheKey(p), json);
      setData(json);
      setTick((t) => t + 1);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // First mount: if we already have cached data for the default period
  // (e.g. user navigated away and came back), skip the network call and
  // the re-mount animation entirely — that's the "reload feeling" this fixes.
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (data) return;
    }
    fetchData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, fetchData]);

  // Prefetch all other periods after first load so tab-switching is instant
  useEffect(() => {
    const timer = setTimeout(() => {
      PERIODS.filter((p) => p !== period && !getCached<ChartData>(cacheKey(p))).forEach((p) => {
        fetch(`/api/dashboard/chart?period=${p}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((json: ChartData) => setCached(cacheKey(p), json))
          .catch(() => {});
      });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build chart config ────────────────────────────────────
  const makeDatasets = () => {
    if (!data) return [];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    let violetGrad: CanvasGradient | string = "rgba(124,58,237,0.12)";
    let greenGrad: CanvasGradient | string = "rgba(5,150,105,0.10)";

    if (ctx) {
      violetGrad = ctx.createLinearGradient(0, 0, 0, 280);
      violetGrad.addColorStop(0, "rgba(124,58,237,0.24)");
      violetGrad.addColorStop(0.6, "rgba(139,92,246,0.06)");
      violetGrad.addColorStop(1, "rgba(139,92,246,0)");

      greenGrad = ctx.createLinearGradient(0, 0, 0, 280);
      greenGrad.addColorStop(0, "rgba(5,150,105,0.18)");
      greenGrad.addColorStop(0.6, "rgba(16,185,129,0.05)");
      greenGrad.addColorStop(1, "rgba(16,185,129,0)");
    }

    const maxRev = Math.max(...data.revenue, 1);
    const maxOrd = Math.max(...data.orders, 1);

    return [
      {
        label: "Revenue",
        data: data.revenue,
        borderColor: "#7C3AED",
        borderWidth: 2.5,
        backgroundColor: violetGrad,
        fill: true,
        tension: 0.44,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#7C3AED",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
      {
        label: "Orders",
        data: data.orders.map((o) => (o / maxOrd) * maxRev * 0.6),
        borderColor: "#059669",
        borderWidth: 2,
        backgroundColor: greenGrad,
        fill: true,
        tension: 0.44,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#059669",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ];
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" as const },
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "rgba(124,58,237,0.15)",
        borderWidth: 1,
        titleColor: "#6D28D9",
        bodyColor: "#374151",
        padding: 12,
        cornerRadius: 12,
        titleFont: { weight: 600, size: 12 },
        bodyFont: { size: 12 },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            if (!data) return "";
            if (ctx.datasetIndex === 0) {
              const v = data.revenue[ctx.dataIndex];
              const fmt =
                v >= 100000
                  ? `₨ ${(v / 100000).toFixed(2)}L`
                  : v >= 1000
                  ? `₨ ${(v / 1000).toFixed(1)}K`
                  : `₨ ${v}`;
              return `  Revenue: ${fmt}`;
            }
            return `  Orders: ${data.orders[ctx.dataIndex]}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.04)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11, family: "Inter, sans-serif" },
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)", drawTicks: false },
        border: { display: false },
        position: "left" as const,
        ticks: {
          color: "#9CA3AF",
          font: { size: 10, family: "Inter, sans-serif" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (v: any) =>
            v >= 100000
              ? `₨${(v / 100000).toFixed(1)}L`
              : v >= 1000
              ? `₨${(v / 1000).toFixed(0)}K`
              : `₨${v}`,
          maxTicksLimit: 5,
        },
      },
    },
  };

  const totalRevDisplay = data
    ? data.totalRevenue >= 100000
      ? `₨ ${(data.totalRevenue / 100000).toFixed(2)}L`
      : data.totalRevenue >= 1000
      ? `₨ ${(data.totalRevenue / 1000).toFixed(1)}K`
      : `₨ ${data.totalRevenue}`
    : "—";

  const isPositive = (data?.growth ?? 0) >= 0;

  return (
    <div
      className="rounded-3xl overflow-hidden bg-white border border-gray-100 transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_40px_rgba(124,58,237,0.09),0_4px_12px_rgba(0,0,0,0.04)]"
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(124,58,237,0.06), 0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #7C3AED 0%, #8B5CF6 50%, #059669 100%)" }}
      />

      <div className="px-4 sm:px-6 pt-5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">
              Revenue Overview
            </p>

            <div className="flex items-baseline gap-3 flex-wrap">
              {loading ? (
                <div className="h-8 w-32 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                  {totalRevDisplay}
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

            <div className="flex items-center gap-4 mt-0.5">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#7C3AED", boxShadow: "0 0 0 3px rgba(124,58,237,0.12)" }}
                />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#059669", boxShadow: "0 0 0 3px rgba(5,150,105,0.12)" }}
                />
                Orders {data ? `(${data.totalOrders})` : ""}
              </span>
            </div>
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
                className="px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 disabled:opacity-60 shrink-0"
                style={
                  period === p
                    ? { background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", boxShadow: "0 2px 10px rgba(124,58,237,0.35)" }
                    : { background: "transparent", color: "#9CA3AF" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-6 h-[190px] sm:h-[220px]">
        {loading || !data ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-end gap-2 h-24">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg animate-pulse"
                  style={{
                    height: `${h}%`,
                    background: i % 2 === 0 ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.05)",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-300 font-medium">Loading chart…</p>
          </div>
        ) : (
          <Line key={tick} data={{ labels: data.labels, datasets: makeDatasets() }} options={chartOptions} />
        )}
      </div>

      {data && !loading && (
        <div className="grid grid-cols-3 border-t border-gray-50 divide-x divide-gray-50">
          {[
            {
              label: "Peak Revenue",
              value: (() => {
                const max = Math.max(...data.revenue);
                return max >= 100000 ? `₨${(max / 100000).toFixed(2)}L` : `₨${(max / 1000).toFixed(1)}K`;
              })(),
              color: "#7C3AED",
            },
            { label: "Peak Orders", value: `${Math.max(...data.orders)}`, color: "#059669" },
            {
              label: "Avg Revenue",
              value: (() => {
                const avg = data.revenue.reduce((a, b) => a + b, 0) / (data.revenue.length || 1);
                return avg >= 100000 ? `₨${(avg / 100000).toFixed(2)}L` : `₨${(avg / 1000).toFixed(1)}K`;
              })(),
              color: "#0EA5E9",
            },
          ].map((s) => (
            <div key={s.label} className="px-2 sm:px-4 py-3 flex flex-col gap-0.5 transition-colors hover:bg-gray-50/60">
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate">{s.label}</p>
              <p className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}