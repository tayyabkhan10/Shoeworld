

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie,
  Legend, ComposedChart,
} from "recharts";
import {
  Activity, Database, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, RefreshCw, CheckCircle2, AlertTriangle,
  XCircle, Zap, Clock, Mail, Cloud, Wifi, Shield,
  Lock, Gauge, Eye, ArrowUpRight, Minus, Smartphone, Monitor,
  BarChart3, Cpu, Layers, Terminal, Hash, PlayCircle, Loader2, Info, X,
  ShieldCheck, ShieldAlert, FileCheck2, FileX2, Radar as RadarIcon, Fingerprint, Satellite,
} from "lucide-react";
import { GRADE_COLORS, PAGE_CHART_COLORS, BRAND, scoreToGrade } from "@/lib/website-health-utils";
import type { HealthGrade } from "@/lib/website-health-utils";

// ── Module-level cache — survives page navigation ──────────
let globalHealthCache: HealthData | null = null;
let globalHistory: { score: number; time: string }[] = [];
let globalLastFetch = 0;
const REFETCH_INTERVAL = 30_000; // 30 seconds

// ── Types ──────────────────────────────────────────────────
interface PageSpeedResult {
  strategy: string; performance: number; seo: number;
  accessibility: number; bestPractices: number;
  fcp: string; lcp: string; cls: string; tbt: string; speedIndex: string; ttfb: string;
}
interface PageLoad { name: string; path: string; ms: number; httpStatus: number; ok: boolean; grade: HealthGrade; important: boolean }
interface HealthData {
  timestamp: string; score: number; overallStatus: HealthGrade;
  pagespeedConfigured: boolean;
  database: { status: HealthGrade; pingMs: number; usersQueryMs: number; ordersQueryMs: number; productsQueryMs: number; connected: boolean };
  server: { status: HealthGrade; memUsedMB: number; memTotalMB: number; memPercent: number; uptimeHours: number; uptimeMinutes: number; apiResponseMs: number; nodeVersion: string };
  business: { totalUsers: number; newUsersToday: number; totalOrders: number; todayOrders: number; yesterdayOrders: number; ordersGrowth: number; todayRevenue: number; yesterdayRevenue: number; revenueGrowth: number; failedOrders: number; failedOrdersPercent: number; totalProducts: number; lowStockProducts: number; outOfStockProducts: number; activeSessionCount: number; cartAbandonmentRate: number };
  pageLoads: PageLoad[];
  ssl: { valid: boolean; grade: string; httpsActive: boolean };
  seo: { sitemapOk: boolean; robotsOk: boolean; sitemapStatus: number; robotsStatus: number };
  services: Record<string, string>;
}

const GC = GRADE_COLORS;

// ── Card ───────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(20,20,60,0.06)] p-3 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub, accent }: { icon: React.ElementType; title: string; sub?: string; accent?: string }) {
  const color = accent || BRAND.primary;
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-4">
      <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xs sm:text-sm font-bold text-[#1e2147] leading-tight">{title}</h2>
        {sub && <p className="text-[10px] sm:text-xs text-[#9598ab] leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit = "ms" }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-bold text-[#1e2147] mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}{unit}</p>
      ))}
    </div>
  );
}

function Growth({ value }: { value: number }) {
  if (value === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-gray-400 font-semibold"><Minus className="w-3 h-3" />0%</span>;
  const pos = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold ${pos ? "text-emerald-500" : "text-red-500"}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(value)}%
    </span>
  );
}

function ServicePill({ label, value, icon: Icon, index = 0 }: { label: string; value: string; icon: React.ElementType; index?: number }) {
  const ok = value === "operational" || value === "configured";
  const color = ok ? "#16a34a" : "#dc2626";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl overflow-hidden"
      style={{
        background: ok ? "linear-gradient(135deg,rgba(22,163,74,0.06),rgba(22,163,74,0.01))" : "linear-gradient(135deg,rgba(220,38,38,0.06),rgba(220,38,38,0.01))",
        border: `1px solid ${color}22`,
      }}>
      <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" style={{ background: `${color}14` }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
      </div>
      <span className="text-[10px] sm:text-xs font-semibold text-[#3a3d52] flex-1 truncate min-w-0">{label}</span>
      <span className="relative flex h-2 w-2 shrink-0">
        {ok && <motion.span className="absolute inline-flex h-full w-full rounded-full" style={{ background: color }}
          animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
      </span>
    </motion.div>
  );
}

function ScoreDonut({ score, status }: { score: number; status: HealthGrade }) {
  const color = GC[status].hex;
  const r = 52, circ = 2 * Math.PI * r;
  const labels: Record<HealthGrade, string> = { excellent: "Excellent", good: "Good", fair: "Fair", poor: "Critical" };
  return (
    <div className="relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 shrink-0">
      <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#eef0f4" strokeWidth="11" />
        <motion.circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-2xl sm:text-3xl font-black text-[#1e2147]">{score}</span>
        <span className="text-[9px] sm:text-[11px] font-semibold" style={{ color }}>{labels[status]}</span>
      </div>
    </div>
  );
}

function ScoreHistoryChart({ history }: { history: { score: number; time: string }[] }) {
  if (history.length < 2) return <p className="text-[10px] sm:text-xs text-gray-400 text-center py-4 sm:py-6">Collecting data… refresh a few times</p>;
  return (
    <ResponsiveContainer width="100%" height={90} className="sm:!h-[120px]">
      <AreaChart data={history} margin={{ left: -10 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.25} />
            <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#aeb1c2" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#aeb1c2" }} width={24} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip unit="" />} />
        <Area type="monotone" dataKey="score" name="Score" stroke={BRAND.primary} strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: BRAND.primary, r: 3, stroke: "#fff", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DBQueryChart({ database }: { database: HealthData["database"] }) {
  const data = [
    { name: "Ping",     ms: database.pingMs,          fill: BRAND.primary },
    { name: "Users",    ms: database.usersQueryMs,    fill: "#22c55e" },
    { name: "Orders",   ms: database.ordersQueryMs,   fill: BRAND.amber },
    { name: "Products", ms: database.productsQueryMs, fill: "#3b82f6" },
  ];
  return (
    <ResponsiveContainer width="100%" height={130} className="sm:!h-[180px]">
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9598ab" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "#aeb1c2" }} width={32} unit="ms" axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="ms" name="Response" radius={[8, 8, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MemoryDonut({ server }: { server: HealthData["server"] }) {
  const used = server.memUsedMB, free = server.memTotalMB - used;
  const data = [
    { name: "Used", value: used,  fill: GC[server.status].hex },
    { name: "Free", value: free,  fill: "#eef0f4" },
  ];
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <ResponsiveContainer width={88} height={88} className="sm:!w-[110px] sm:!h-[110px]">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={26} outerRadius={40} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 sm:space-y-2 flex-1">
        <div><p className="text-[10px] sm:text-xs text-gray-400">Used</p><p className="text-base sm:text-lg font-black" style={{ color: GC[server.status].hex }}>{used}MB</p></div>
        <div><p className="text-[10px] sm:text-xs text-gray-400">Total</p><p className="text-base sm:text-lg font-black text-[#1e2147]">{server.memTotalMB}MB</p></div>
        <div className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${GC[server.status].hex}15`, color: GC[server.status].hex }}>{server.memPercent}% used</div>
      </div>
    </div>
  );
}

function PageLoadChart({ pageLoads }: { pageLoads: PageLoad[] }) {
  const data = pageLoads.map((p, i) => ({ name: p.name, ms: p.ms === 9999 ? 0 : p.ms, fill: PAGE_CHART_COLORS[i % PAGE_CHART_COLORS.length], ok: p.ok }));
  const chartHeight = Math.max(180, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: "#aeb1c2" }} unit="ms" axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9598ab" }} width={64} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="ms" name="Load Time" radius={[0, 8, 8, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.ok ? d.fill : "#ef4444"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PageSpeedRadar({ mobile, desktop }: { mobile: PageSpeedResult | null; desktop: PageSpeedResult | null }) {
  const data = [
    { metric: "Performance",    mobile: mobile?.performance ?? 0,   desktop: desktop?.performance ?? 0 },
    { metric: "SEO",            mobile: mobile?.seo ?? 0,           desktop: desktop?.seo ?? 0 },
    { metric: "Accessibility",  mobile: mobile?.accessibility ?? 0, desktop: desktop?.accessibility ?? 0 },
    { metric: "Best Practices", mobile: mobile?.bestPractices ?? 0, desktop: desktop?.bestPractices ?? 0 },
  ];
  return (
    <ResponsiveContainer width="100%" height={180} className="sm:!h-[220px]">
      <RadarChart data={data}>
        <PolarGrid stroke={BRAND.grid} />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#9598ab" }} />
        {mobile  && <Radar name="Mobile"  dataKey="mobile"  stroke={BRAND.primary} fill={BRAND.primary} fillOpacity={0.18} strokeWidth={2} dot />}
        {desktop && <Radar name="Desktop" dataKey="desktop" stroke="#22c55e"       fill="#22c55e"       fillOpacity={0.15} strokeWidth={2} dot />}
        <Legend wrapperStyle={{ fontSize: 10, color: "#9598ab" }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #eef0f4", borderRadius: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function BusinessComboChart({ business }: { business: HealthData["business"] }) {
  const data = [
    { label: "Yesterday", orders: business.yesterdayOrders, revenue: Math.round(business.yesterdayRevenue / 100) },
    { label: "Today",     orders: business.todayOrders,     revenue: Math.round(business.todayRevenue / 100) },
  ];
  return (
    <ResponsiveContainer width="100%" height={130} className="sm:!h-[160px]">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9598ab" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left"  tick={{ fontSize: 9, fill: "#aeb1c2" }} width={26} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#aeb1c2" }} width={34} unit="k" axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #eef0f4", borderRadius: 12 }} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#9598ab" }} />
        <Bar  yAxisId="left"  dataKey="orders"  name="Orders"          fill={BRAND.primary} radius={[6,6,0,0]} fillOpacity={0.85} />
        <Line yAxisId="right" dataKey="revenue" name="Revenue (00s)"   stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} type="monotone" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function StockDonut({ business }: { business: HealthData["business"] }) {
  const healthy = business.totalProducts - business.lowStockProducts - business.outOfStockProducts;
  const data = [
    { name: "Healthy",   value: Math.max(0, healthy),        fill: "#22c55e" },
    { name: "Low Stock", value: business.lowStockProducts,   fill: BRAND.amber },
    { name: "Out",       value: business.outOfStockProducts, fill: "#ef4444" },
  ].filter(d => d.value > 0);
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <ResponsiveContainer width={84} height={84} className="sm:!w-[100px] sm:!h-[100px]">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={38} paddingAngle={2} dataKey="value">
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 sm:space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
            <span className="text-[10px] sm:text-xs text-gray-500">{d.name}: <span className="font-bold text-[#1e2147]">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, val, sub, icon: Icon, color }: { label: string; val: React.ReactNode; sub: React.ReactNode; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-2 sm:p-3.5 hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2">
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color }} />
        </div>
        <p className="text-[9px] sm:text-xs text-gray-400 font-medium truncate">{label}</p>
      </div>
      <p className="text-base sm:text-xl font-black text-[#1e2147] leading-tight truncate">{val}</p>
      <div className="text-[9px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</div>
    </div>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
    </span>
  );
}

function PageTestRow({ page }: { page: PageLoad }) {
  const [live, setLive] = useState<PageLoad>(page);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/health/page-test?path=${encodeURIComponent(page.path)}`, { cache: "no-store" });
      const json = await res.json();
      setLive((l) => ({ ...l, ...json }));
    } catch(err) { console.error("Health check failed:", err);}
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-semibold"
      style={{ background: live.ok ? `${GC[live.grade].hex}10` : "#ef444410", borderColor: live.ok ? `${GC[live.grade].hex}30` : "#ef444430", color: live.ok ? GC[live.grade].hex : "#ef4444" }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: live.ok ? GC[live.grade].hex : "#ef4444" }} />
      <span className="text-[#1e2147] truncate max-w-[72px] sm:max-w-none">{live.name}</span>
      <span className="opacity-70 whitespace-nowrap">{live.ms === 9999 ? "Err" : `${live.ms}ms`}</span>
      <button onClick={run} disabled={busy} className="ml-0.5 sm:ml-1 p-1 rounded-lg hover:bg-white/60 disabled:opacity-50 shrink-0" title="Re-test this page">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
      </button>
    </div>
  );
}

function PageSpeedPanel({ configured }: { configured: boolean }) {
  const [tab, setTab]       = useState<"mobile" | "desktop">("mobile");
  const [results, setResults] = useState<{ mobile: PageSpeedResult | null; desktop: PageSpeedResult | null }>({ mobile: null, desktop: null });
  const [loading, setLoading] = useState<"mobile" | "desktop" | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [note, setNote]     = useState<string | null>(null);

  const run = async (strategy: "mobile" | "desktop") => {
    setLoading(strategy); setError(null);
    try {
      const res  = await fetch(`/api/admin/health/pagespeed?strategy=${strategy}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) setError(json.error);
      else {
        setResults((r) => ({ ...r, [strategy]: json.data }));
        setNote(json.isLocal ? `Tested live URL: ${json.testedUrl} (PageSpeed can't reach localhost)` : null);
      }
    } catch { setError("Request failed"); }
    finally { setLoading(null); }
  };

  const active = results[tab];

  if (!configured) return (
    <div className="text-center py-7 sm:py-10 text-gray-400 text-sm">
      <Gauge className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-20" />
      <p className="font-semibold text-gray-500 mb-1 text-xs sm:text-sm">PageSpeed key missing</p>
      <p className="text-[10px] sm:text-xs px-2">Add <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[#5b6cf0]">PAGESPEED_API_KEY</code> to your .env</p>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-1 rounded-lg sm:rounded-xl p-1 shrink-0">
          {(["mobile", "desktop"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${tab === t ? "bg-[#5b6cf0] text-white shadow" : "text-gray-400 hover:text-gray-600"}`}>
              {t === "mobile" ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              {t === "mobile" ? "Mobile" : "Desktop"}
            </button>
          ))}
        </div>
        <button onClick={() => run(tab)} disabled={loading === tab}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-[#1e2147] text-white hover:bg-[#2c2f5c] disabled:opacity-50 transition-colors shrink-0">
          {loading === tab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
          {loading === tab ? "Testing…" : results[tab] ? "Re-test" : "Run test"}
        </button>
      </div>
      {error && <p className="text-[10px] sm:text-xs text-red-500 mb-3">{error}</p>}
      {note  && <p className="text-[10px] sm:text-xs text-amber-500 mb-3">ℹ {note}</p>}
      {active ? (
        <>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-gray-100">
            {[
              { label: "Performance",    v: active.performance },
              { label: "SEO",            v: active.seo },
              { label: "Accessibility",  v: active.accessibility },
              { label: "Best Practices", v: active.bestPractices },
            ].map((m) => {
              const grade = scoreToGrade(m.v);
              return (
                <div key={m.label} className="flex flex-col items-center gap-1 sm:gap-1.5">
                  <div className="relative w-[58px] h-[58px] sm:w-[88px] sm:h-[88px] flex items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="33" fill="none" stroke="#eef0f4" strokeWidth="7" />
                      <circle cx="44" cy="44" r="33" fill="none" stroke={GC[grade].hex} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 33} strokeDashoffset={2 * Math.PI * 33 * (1 - m.v / 100)} />
                    </svg>
                    <span className="font-black text-[#1e2147] text-sm sm:text-lg">{m.v}</span>
                  </div>
                  <span className="text-[8px] sm:text-xs text-gray-400 font-semibold text-center leading-tight">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {[
              { label: "FCP", val: active.fcp }, { label: "LCP", val: active.lcp },
              { label: "CLS", val: active.cls }, { label: "TBT", val: active.tbt },
              { label: "Speed Index", val: active.speedIndex }, { label: "TTFB", val: active.ttfb },
            ].map((m) => (
              <div key={m.label} className="rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-gray-100">
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-semibold leading-tight">{m.label}</p>
                <p className="text-xs sm:text-sm font-black text-[#1e2147] mt-0.5">{m.val}</p>
              </div>
            ))}
          </div>
          {(results.mobile || results.desktop) && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Mobile vs Desktop</p>
              <PageSpeedRadar mobile={results.mobile} desktop={results.desktop} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-7 sm:py-10 text-gray-400 text-sm">
          <Gauge className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-20" />
          <p className="text-xs sm:text-sm">Click <span className="font-semibold text-[#1e2147]">"Run test"</span> to fetch Lighthouse scores for {tab}.</p>
          <p className="text-[10px] sm:text-xs mt-1 text-gray-400">Results are cached for 24 hours.</p>
        </div>
      )}
    </>
  );
}

type Issue = { label: string; value: string; severity: HealthGrade; fix: string };
function severityScore(s: HealthGrade) { return s === "poor" ? 90 : s === "fair" ? 60 : s === "good" ? 30 : 10; }

function buildIssues(data: HealthData): Issue[] {
  const issues: Issue[] = [];
  if (data.database.pingMs > 2000) issues.push({ label: "Database ping is very slow", value: `${data.database.pingMs}ms`, severity: "poor", fix: "DB region is far from app. Use connection pooling (PgBouncer / Neon pooled)." });
  else if (data.database.pingMs > 1000) issues.push({ label: "Database ping is slow", value: `${data.database.pingMs}ms`, severity: "fair", fix: "Serverless cold-start. Enable connection pooling or warm the DB with a periodic ping." });
  if (data.server.memPercent > 85) issues.push({ label: "Memory usage is high", value: `${data.server.memPercent}%`, severity: data.server.memPercent > 95 ? "poor" : "fair", fix: "Check for memory leaks. Increase function memory in Vercel settings." });
  if (data.business.failedOrdersPercent > 10) issues.push({ label: "High failed/cancelled orders", value: `${data.business.failedOrdersPercent}%`, severity: data.business.failedOrdersPercent > 20 ? "poor" : "fair", fix: "Review payment gateway and stock-check logic." });
  if (!data.ssl.httpsActive) issues.push({ label: "Site not served over HTTPS", value: "HTTP", severity: "poor", fix: "Expected on localhost. Auto-fixed on Vercel." });
  else if (!data.ssl.valid) issues.push({ label: "SSL certificate issue", value: data.ssl.grade, severity: "poor", fix: "Renew certificate from Vercel/Cloudflare." });
  if (!data.seo.sitemapOk) issues.push({ label: "sitemap.xml missing", value: `status ${data.seo.sitemapStatus}`, severity: "fair", fix: "/sitemap.xml should return HTTP 200." });
  if (!data.seo.robotsOk) issues.push({ label: "robots.txt missing", value: `status ${data.seo.robotsStatus}`, severity: "fair", fix: "/robots.txt should return HTTP 200." });
  data.pageLoads.filter((p) => p.ms > 3000 || !p.ok).forEach((p) =>
    issues.push({ label: `${p.name} page is slow or erroring`, value: p.ms === 9999 ? "Error" : `${p.ms}ms`, severity: "poor", fix: `Profile "${p.name}" — look for heavy DB query, missing index, or large image.` })
  );
  if (data.business.outOfStockProducts > data.business.totalProducts * 0.3)
    issues.push({ label: "Too many products out of stock", value: `${data.business.outOfStockProducts}`, severity: "fair", fix: "Restock or hide out-of-stock products." });
  return issues;
}

function IssuesChart({ issues }: { issues: Issue[] }) {
  const data = issues.map((iss) => ({ name: iss.label, severity: severityScore(iss.severity), safe: 25 }));
  const worstIdx = data.reduce((best, d, i) => (d.severity > data[best].severity ? i : best), 0);
  const Dot = (props: any) => {
    const { cx, cy, index } = props;
    if (index !== worstIdx) return <circle cx={cx} cy={cy} r={3} fill="#7c5cff" />;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#fff" stroke="#7c5cff" strokeWidth={3} />
        <rect x={cx - 14} y={cy - 28} width="28" height="18" rx="9" fill="#7c5cff" />
        <text x={cx} y={cy - 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{data[index].severity}</text>
      </g>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={110} className="sm:!h-[140px]">
      <LineChart data={data} margin={{ top: 24, left: -20, right: 10 }}>
        <Line type="natural" dataKey="safe"     stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line type="natural" dataKey="severity" stroke="#7c5cff" strokeWidth={3}   dot={<Dot />} isAnimationActive />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AllIssuesPanel({ issues, onClose }: { issues: Issue[]; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(2px)" }}
        onClick={onClose}>
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:w-[440px] max-h-[82vh] rounded-[28px] flex flex-col overflow-hidden"
          style={{
            background: "linear-gradient(165deg,rgba(255,255,255,0.42) 0%,rgba(255,255,255,0.22) 45%,rgba(255,255,255,0.30) 100%)",
            backdropFilter: "blur(22px) saturate(180%)", WebkitBackdropFilter: "blur(22px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 24px 70px -10px rgba(31,38,80,0.25),inset 0 1px 0 rgba(255,255,255,0.9),inset 0 0 50px rgba(255,255,255,0.25)",
          }}>
          <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0) 70%)" }} />
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.95) 50%,rgba(255,255,255,0) 100%)" }} />
          <div className="relative flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(20,20,40,0.1)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.16)", border: "1px solid rgba(217,119,6,0.35)" }}>
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-[#13152b] truncate">{issues.length} issue{issues.length > 1 ? "s" : ""} found</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-colors" style={{ background: "rgba(20,20,40,0.08)", border: "1px solid rgba(20,20,40,0.12)" }}>
              <X className="w-3.5 h-3.5 text-[#13152b]" />
            </button>
          </div>
          <div className="relative overflow-y-auto px-3.5 py-3 space-y-2">
            {issues.map((iss, i) => (
              <div key={i} className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8),0 2px 10px rgba(31,38,80,0.06)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GC[iss.severity].hex, boxShadow: `0 0 6px ${GC[iss.severity].hex}80` }} />
                  <span className="text-xs font-bold text-[#13152b] truncate flex-1 min-w-0">{iss.label}</span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: GC[iss.severity].hex }}>{iss.value}</span>
                </div>
                <p className="text-[11px] text-[#13152b]/70 leading-snug mt-1">{iss.fix}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DiagnosticsPanel({ data }: { data: HealthData }) {
  const issues = buildIssues(data);
  const [panelOpen, setPanelOpen] = useState(false);
  if (issues.length === 0) return (
    <Card className="border-emerald-100">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
        <p className="text-xs sm:text-sm font-bold text-[#1e2147]">No issues found — everything is running smoothly.</p>
      </div>
    </Card>
  );
  return (
    <Card className="border-amber-100">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={AlertTriangle} title={`${issues.length} issue${issues.length > 1 ? "s" : ""} found — why the score dropped`} sub="Tap the icon to see all fixes" accent="#d97706" />
        <button onClick={() => setPanelOpen(true)} title="View all issues"
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 mb-3.5 sm:mb-4 transition-transform hover:scale-105"
          style={{ background: BRAND.ink }}>
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>
      </div>
      <IssuesChart issues={issues} />
      {panelOpen && <AllIssuesPanel issues={issues} onClose={() => setPanelOpen(false)} />}
    </Card>
  );
}

// ══ Main Component ════════════════════════════════════════════
export default function WebsiteHealthDashboard() {
  const [data, setData]         = useState<HealthData | null>(globalHealthCache);
  const [loading, setLoading]   = useState(!globalHealthCache);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown]   = useState(30);
  const [history, setHistory]   = useState<{ score: number; time: string }[]>(globalHistory);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res  = await fetch("/api/admin/health", { cache: "no-store" });
      const json: HealthData = await res.json();

      // Update module-level cache
      globalHealthCache = json;
      globalLastFetch   = Date.now();
      const newEntry = { score: json.score, time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) };
      globalHistory = [...globalHistory.slice(-14), newEntry];

      setData(json);
      setCountdown(30);
      setHistory(globalHistory);
    } catch(err) { console.error("Health check failed:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    // Agar cache fresh hai (30s se kam) to API call mat karo
    const age = Date.now() - globalLastFetch;
    if (globalHealthCache && age < REFETCH_INTERVAL) {
      setData(globalHealthCache);
      setHistory(globalHistory);
      setLoading(false);
      // Baki countdown wahan se shuru karo jahan chhuta tha
      setCountdown(Math.ceil((REFETCH_INTERVAL - age) / 1000));
    } else {
      fetchHealth();
    }

    // 30 second auto-refresh
    timerRef.current = setInterval(() => fetchHealth(), REFETCH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchHealth]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [data]);

  if (loading) return (
    <AdminLayout>
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Activity className="w-8 h-8 text-[#5b6cf0]" />
          </motion.div>
          <p className="text-gray-500 text-sm font-medium">Running health checks…</p>
          <p className="text-gray-400 text-xs">DB · Server · SSL · All pages</p>
        </div>
      </div>
    </AdminLayout>
  );

  if (!data) return (
    <AdminLayout>
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-gray-600 font-semibold">Health check failed</p>
          <button onClick={() => fetchHealth(true)} className="px-4 py-2 bg-[#5b6cf0] text-white rounded-xl text-sm font-medium hover:bg-[#4a5ae0] transition-colors">Retry</button>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="text-[#1e2147]">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-3 sm:py-6 space-y-2.5 sm:space-y-4">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-[#eef0ff] rounded-lg sm:rounded-xl shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#5b6cf0]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black tracking-tight leading-tight">Health Monitor</h1>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <PulseDot color="#22c55e" />
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                    {new Date(data.timestamp).toLocaleTimeString("en-PK")} · {countdown}s
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => fetchHealth(true)} disabled={refreshing}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-100 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#1e2147] hover:shadow-md transition-all disabled:opacity-50 shrink-0">
              <motion.span animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.6, repeat: refreshing ? Infinity : 0 }}>
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.span>
              <span className="hidden sm:inline">{refreshing ? "Checking…" : "Refresh"}</span>
            </button>
          </motion.div>

          {/* Alert Banner */}
          <AnimatePresence>
            {(data.overallStatus === "poor" || data.overallStatus === "fair") && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium ${data.overallStatus === "poor" ? "bg-red-50 border-red-100 text-red-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                {data.overallStatus === "poor" ? "Critical issues detected — immediate action required." : "Some systems need attention."}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diagnostics */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.03 }}>
            <DiagnosticsPanel data={data} />
          </motion.div>

          {/* 1. Overall Score */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.05 }}>
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-3 w-full sm:w-auto sm:contents">
                  <ScoreDonut score={data.score} status={data.overallStatus} />
                  <div className="grid grid-cols-2 gap-1.5 flex-1 sm:hidden">
                    <div className="rounded-lg p-2 border border-gray-100 bg-[#f9fafc]"><p className="text-[9px] text-gray-400">DB Ping</p><p className="text-sm font-black" style={{ color: GC[data.database.status].hex }}>{data.database.pingMs}ms</p></div>
                    <div className="rounded-lg p-2 border border-gray-100 bg-[#f9fafc]"><p className="text-[9px] text-gray-400">Memory</p><p className="text-sm font-black" style={{ color: GC[data.server.status].hex }}>{data.server.memPercent}%</p></div>
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
                  <div className="hidden sm:grid grid-cols-4 gap-2">
                    {[
                      { label: "DB Ping",       val: `${data.database.pingMs}ms`,             color: GC[data.database.status].hex },
                      { label: "Memory",        val: `${data.server.memPercent}%`,            color: GC[data.server.status].hex },
                      { label: "Failed Orders", val: `${data.business.failedOrdersPercent}%`, color: data.business.failedOrdersPercent > 10 ? "#ef4444" : "#22c55e" },
                      { label: "Live Users",    val: `${data.business.activeSessionCount}`,   color: BRAND.primary },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl p-3 border border-gray-100 bg-[#f9fafc]">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-lg font-black mt-0.5" style={{ color: item.color }}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:hidden">
                    <div className="rounded-lg p-2 border border-gray-100 bg-[#f9fafc]"><p className="text-[9px] text-gray-400">Failed Orders</p><p className="text-sm font-black" style={{ color: data.business.failedOrdersPercent > 10 ? "#ef4444" : "#22c55e" }}>{data.business.failedOrdersPercent}%</p></div>
                    <div className="rounded-lg p-2 border border-gray-100 bg-[#f9fafc]"><p className="text-[9px] text-gray-400">Live Users</p><p className="text-sm font-black" style={{ color: BRAND.primary }}>{data.business.activeSessionCount}</p></div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1.5 sm:mb-2 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Score History</p>
                    <ScoreHistoryChart history={history} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 2. PageSpeed */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.1 }}>
            <Card>
              <SectionTitle icon={Gauge} title="Google PageSpeed Insights" sub="Tap run test — never calls the API automatically" accent={BRAND.primary} />
              <PageSpeedPanel configured={data.pagespeedConfigured} />
            </Card>
          </motion.div>

          {/* 3. Page Load Times */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.15 }}>
            <Card>
              <SectionTitle icon={Eye} title="Page Load Times" sub="Tap ▶ on any page to re-test just that page" accent="#3b82f6" />
              <PageLoadChart pageLoads={data.pageLoads} />
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                {data.pageLoads.map((p) => <PageTestRow key={p.path} page={p} />)}
              </div>
            </Card>
          </motion.div>

          {/* 4. Database */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.2 }}>
            <Card>
              <div className="flex items-center justify-between mb-1 gap-2">
                <SectionTitle icon={Database} title="Database Performance" sub="PostgreSQL query response times" accent="#22c55e" />
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-bold shrink-0"
                  style={{ background: `${GC[data.database.status].hex}12`, borderColor: `${GC[data.database.status].hex}30`, color: GC[data.database.status].hex }}>
                  <PulseDot color={GC[data.database.status].hex} />
                  <span className="hidden sm:inline">{data.database.connected ? "Connected" : "Disconnected"}</span>
                </div>
              </div>
              <DBQueryChart database={data.database} />
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100">
                {[
                  { label: "Ping",       ms: data.database.pingMs },
                  { label: "Users Q",    ms: data.database.usersQueryMs },
                  { label: "Orders Q",   ms: data.database.ordersQueryMs },
                  { label: "Products Q", ms: data.database.productsQueryMs },
                ].map((q) => {
                  const grade: HealthGrade = q.ms < 300 ? "excellent" : q.ms < 800 ? "good" : q.ms < 1500 ? "fair" : "poor";
                  return (
                    <div key={q.label} className="text-center bg-[#f9fafc] rounded-lg sm:rounded-xl p-1.5 sm:p-3 border border-gray-100 min-w-0">
                      <p className="text-[8px] sm:text-xs text-gray-400 truncate">{q.label}</p>
                      <p className="text-xs sm:text-base font-black mt-0.5" style={{ color: GC[grade].hex }}>{q.ms}ms</p>
                      <p className="text-[7px] sm:text-[10px] font-semibold capitalize mt-0.5" style={{ color: GC[grade].hex }}>{grade}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* 5. Server & Memory */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.25 }}>
            <Card>
              <SectionTitle icon={Cpu} title="Server & Runtime" sub="Memory, uptime, Node.js info" accent={BRAND.amber} />
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <MemoryDonut server={data.server} />
                <div className="flex-1 grid grid-cols-2 gap-1.5 sm:gap-3">
                  {[
                    { label: "Uptime",       val: `${data.server.uptimeHours}h ${data.server.uptimeMinutes}m`, icon: Clock },
                    { label: "API Response", val: `${data.server.apiResponseMs}ms`,                           icon: Zap },
                    { label: "Node.js",      val: data.server.nodeVersion,                                    icon: Terminal },
                    { label: "Status",       val: data.server.status.charAt(0).toUpperCase() + data.server.status.slice(1), icon: Activity },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#f9fafc] rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-100 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                        <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" />
                        <p className="text-[9px] sm:text-xs text-gray-400 truncate">{item.label}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-[#1e2147] truncate">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 6. Business Metrics */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.3 }}>
            <Card>
              <SectionTitle icon={ShoppingCart} title="Business Health" sub="Orders, revenue, users, stock" accent={BRAND.pink} />
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-4 sm:mb-5">
                <StatCard label="Total Users"   val={data.business.totalUsers.toLocaleString()}           sub={`+${data.business.newUsersToday} today`}         icon={Users}        color={BRAND.primary} />
                <StatCard label="Today Orders"  val={data.business.todayOrders}                           sub={<Growth value={data.business.ordersGrowth} />}    icon={ShoppingCart} color="#22c55e" />
                <StatCard label="Today Revenue" val={`Rs ${data.business.todayRevenue.toLocaleString()}`} sub={<Growth value={data.business.revenueGrowth} />}   icon={TrendingUp}   color={BRAND.amber} />
                <StatCard label="Active"        val={data.business.activeSessionCount}                    sub="online now"                                       icon={Eye}          color="#3b82f6" />
                <StatCard label="Products"      val={data.business.totalProducts}                         sub={`${data.business.lowStockProducts}L · ${data.business.outOfStockProducts}O`} icon={Package} color={BRAND.pink} />
                <StatCard label="Failed"        val={`${data.business.failedOrdersPercent}%`}             sub={`${data.business.failedOrders} cancelled`}        icon={XCircle}      color="#ef4444" />
                <StatCard label="Cart Abandon"  val={`${data.business.cartAbandonmentRate}%`}             sub="with items"                                       icon={ShoppingCart} color="#8b5cf6" />
                <StatCard label="All Orders"    val={data.business.totalOrders.toLocaleString()}          sub="all time"                                         icon={Hash}         color={BRAND.teal} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Stock Status</p>
                  <StockDonut business={data.business} />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Today vs Yesterday</p>
                  <BusinessComboChart business={data.business} />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 7. SEO & Security */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.35 }}>
            <Card>
              <SectionTitle icon={RadarIcon} title="SEO & Security" sub="SSL, sitemap, robots.txt" accent={BRAND.teal} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: "SSL Certificate", val: data.ssl.grade,                          ok: data.ssl.valid,         iconOk: ShieldCheck, iconBad: ShieldAlert, detail: data.ssl.valid         ? "HTTPS Secure"                    : "SSL Issue" },
                  { label: "Sitemap.xml",     val: data.seo.sitemapOk ? "Found" : "Missing", ok: data.seo.sitemapOk,   iconOk: FileCheck2,  iconBad: FileX2,      detail: `Status ${data.seo.sitemapStatus || "—"}` },
                  { label: "Robots.txt",      val: data.seo.robotsOk  ? "Found" : "Missing", ok: data.seo.robotsOk,    iconOk: Satellite,   iconBad: Satellite,   detail: `Status ${data.seo.robotsStatus  || "—"}` },
                  { label: "HTTPS",           val: data.ssl.httpsActive ? "Active" : "Inactive", ok: data.ssl.httpsActive, iconOk: Fingerprint, iconBad: Fingerprint, detail: data.ssl.httpsActive ? "Protocol" : "Local dev — auto-fixed on Vercel" },
                ].map((item, i) => {
                  const color    = item.ok ? "#16a34a" : "#dc2626";
                  const ItemIcon = item.ok ? item.iconOk : item.iconBad;
                  return (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, y: 14, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -3, transition: { duration: 0.15 } }}
                      className="relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 overflow-hidden min-w-0"
                      style={{ background: `${color}08`, border: `1px solid ${color}22` }}>
                      <div className="pointer-events-none absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl" style={{ background: `${color}30` }} />
                      <div className="relative flex items-center justify-between mb-2 sm:mb-3">
                        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" style={{ background: `${color}14` }}>
                          <motion.div animate={item.ok ? { rotate: [0, 0] } : { rotate: [0, -6, 6, 0] }} transition={{ duration: 0.5, repeat: item.ok ? 0 : Infinity, repeatDelay: 2 }}>
                            <ItemIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                          </motion.div>
                          {item.ok && (
                            <motion.span className="absolute inset-0 rounded-xl" style={{ border: `1.5px solid ${color}` }}
                              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
                          )}
                        </div>
                        <span className="flex h-2 w-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}90` }} />
                      </div>
                      <p className="relative text-[9px] sm:text-xs text-gray-400 truncate">{item.label}</p>
                      <p className="relative text-xs sm:text-base font-black mt-0.5 truncate" style={{ color }}>{item.val}</p>
                      <p className="relative text-[9px] sm:text-xs text-gray-400 mt-0.5 truncate">{item.detail}</p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* 8. Stock Alert */}
          <AnimatePresence>
            {(data.business.lowStockProducts > 0 || data.business.outOfStockProducts > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-700 mb-1">Stock Alerts</p>
                  {data.business.lowStockProducts > 0  && <p className="text-[10px] sm:text-xs text-amber-600">⚠ {data.business.lowStockProducts} products low on stock (&lt;5 units)</p>}
                  {data.business.outOfStockProducts > 0 && <p className="text-[10px] sm:text-xs text-red-500 font-semibold">🚫 {data.business.outOfStockProducts} products completely out of stock</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 9. External Services */}
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay: 0.4 }}>
            <Card>
              <SectionTitle icon={Layers} title="External Services" sub="All connected services status" accent="#8b5cf6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                <ServicePill index={0} label="PostgreSQL DB"   value={data.services.database}   icon={Database} />
                <ServicePill index={1} label="NextAuth"        value={data.services.nextAuth}   icon={Shield}   />
                <ServicePill index={2} label="Pusher"          value={data.services.pusher}     icon={Wifi}     />
                <ServicePill index={3} label="Cloudinary"      value={data.services.cloudinary} icon={Cloud}    />
                <ServicePill index={4} label="Email (SMTP)"    value={data.services.email}      icon={Mail}     />
                <ServicePill index={5} label="SSL Certificate" value={data.services.ssl}        icon={Lock}     />
              </div>
            </Card>
          </motion.div>

          <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 pb-3 sm:pb-4 gap-2">
            <span className="truncate">softchappal.com · health monitor</span>
            <span className="shrink-0 hidden sm:inline">Auto-refresh every 30s · PageSpeed is on-demand</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}