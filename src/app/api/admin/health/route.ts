// 📁 src/app/api/admin/health/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usersTable, ordersTable, productsTable, cartItemsTable, sessionsTable } from "@/lib/schema";
import { sql, eq, gte, lt, and } from "drizzle-orm";
import { WEBSITE_PAGES, msToGrade, scoreToGrade, calcGrowth } from "@/lib/website-health-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, duration: Math.round(performance.now() - start) };
}

async function checkSSL() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";
  const httpsActive = BASE_URL.startsWith("https://");
  if (!httpsActive) return { valid: false, grade: "N/A", httpsActive: false };
  try {
    const hostname = new URL(BASE_URL).hostname;
    const res = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&fromCache=on&maxAge=24`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return { valid: true, grade: "N/A", httpsActive: true };
    const data = await res.json();
    const grade = data.endpoints?.[0]?.grade ?? "N/A";
    return { valid: grade.startsWith("A") || grade === "N/A", grade, httpsActive: true };
  } catch {
    return { valid: true, grade: "N/A", httpsActive: true };
  }
}

async function checkSEOFiles() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";
  const [sitemap, robots] = await Promise.allSettled([
    fetch(`${BASE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${BASE_URL}/robots.txt`,  { signal: AbortSignal.timeout(5000) }),
  ]);
  return {
    sitemapOk:     sitemap.status === "fulfilled" && sitemap.value.ok,
    robotsOk:      robots.status  === "fulfilled" && robots.value.ok,
    sitemapStatus: sitemap.status === "fulfilled" ? sitemap.value.status : 0,
    robotsStatus:  robots.status  === "fulfilled" ? robots.value.status  : 0,
  };
}

async function checkAllPageLoads() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";
  const results = await Promise.allSettled(
    WEBSITE_PAGES.map(async (page) => {
      const start = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${page.path}`, {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "SoftChappal-HealthBot/1.0" },
        });
        const ms = Math.round(performance.now() - start);
        return { ...page, ms, httpStatus: res.status, ok: res.ok, grade: msToGrade(ms, 800, 2000) };
      } catch {
        return { ...page, ms: 9999, httpStatus: 0, ok: false, grade: "poor" as const };
      }
    })
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...WEBSITE_PAGES[i], ms: 9999, httpStatus: 0, ok: false, grade: "poor" as const }
  );
}

// ── Server-side cache (SSL + SEO + PageLoads) — 24h ───────
type CachedChecks = {
  ssl: Awaited<ReturnType<typeof checkSSL>>;
  seoFiles: Awaited<ReturnType<typeof checkSEOFiles>>;
  pageLoads: Awaited<ReturnType<typeof checkAllPageLoads>>;
};
const healthCache = new Map<string, { data: CachedChecks; expires: number }>();
const HEALTH_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // ── Cached: SSL + SEO + PageLoads (24h) ───────────────
    const cacheKey = "health:static";
    const cached = healthCache.get(cacheKey);
    let staticChecks: CachedChecks;

    if (cached && cached.expires > Date.now()) {
      staticChecks = cached.data;
    } else {
      const [sslR, seoR, pagesR] = await Promise.allSettled([
        checkSSL(),
        checkSEOFiles(),
        checkAllPageLoads(),
      ]);
      staticChecks = {
        ssl:       sslR.status   === "fulfilled" ? sslR.value   : { valid: false, grade: "N/A", httpsActive: false },
        seoFiles:  seoR.status   === "fulfilled" ? seoR.value   : { sitemapOk: false, robotsOk: false, sitemapStatus: 0, robotsStatus: 0 },
        pageLoads: pagesR.status === "fulfilled" ? pagesR.value : [],
      };
      healthCache.set(cacheKey, { data: staticChecks, expires: Date.now() + HEALTH_TTL });
    }

    const { ssl, seoFiles, pageLoads } = staticChecks;

    // ── Always fresh: DB queries ───────────────────────────
    const [
      dbPingR, usersR, ordersR,
      todayOrdersR, yesterdayOrdersR,
      todayRevR, yesterdayRevR,
      productsR, sessionsR, cartR, newUsersR,
    ] = await Promise.allSettled([
      measureTime(() => db.execute(sql`SELECT 1`)),
      measureTime(() => db.select({ count: sql<number>`count(*)::int` }).from(usersTable)),
      measureTime(() =>
        db.select({ count: sql<number>`count(*)::int`, status: ordersTable.status })
          .from(ordersTable)
          .groupBy(ordersTable.status)
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(gte(ordersTable.createdAt, today)),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(and(gte(ordersTable.createdAt, yesterday), lt(ordersTable.createdAt, today))),
      db.select({ total: sql<number>`coalesce(sum(total::numeric),0)` }).from(ordersTable).where(and(gte(ordersTable.createdAt, today), eq(ordersTable.status, "delivered"))),
      db.select({ total: sql<number>`coalesce(sum(total::numeric),0)` }).from(ordersTable).where(and(gte(ordersTable.createdAt, yesterday), lt(ordersTable.createdAt, today), eq(ordersTable.status, "delivered"))),
      measureTime(() =>
        db.select({
          count:      sql<number>`count(*)::int`,
          lowStock:   sql<number>`count(*) filter (where stock_count < 5 and in_stock = true)::int`,
          outOfStock: sql<number>`count(*) filter (where in_stock = false)::int`,
        }).from(productsTable)
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(sessionsTable).where(gte(sessionsTable.expires, now)),
      db.select({ count: sql<number>`count(distinct user_id)::int` }).from(cartItemsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(gte(usersTable.createdAt, today)),
    ]);

    const dbPing          = dbPingR.status       === "fulfilled" ? dbPingR.value.duration        : 9999;
    const usersQueryMs    = usersR.status        === "fulfilled" ? usersR.value.duration         : 0;
    const ordersQueryMs   = ordersR.status       === "fulfilled" ? ordersR.value.duration        : 0;
    const productsQueryMs = productsR.status     === "fulfilled" ? productsR.value.duration      : 0;
    const totalUsers      = usersR.status        === "fulfilled" ? (usersR.value.result[0]?.count ?? 0) : 0;
    const ordersData      = ordersR.status       === "fulfilled" ? ordersR.value.result          : [];
    const totalOrders     = ordersData.reduce((s, r) => s + (r.count ?? 0), 0);
    const failedOrders    = ordersData.find((r) => r.status === "cancelled")?.count ?? 0;
    const failedPct       = totalOrders > 0 ? Math.round((failedOrders / totalOrders) * 100) : 0;
    const todayOrders     = todayOrdersR.status     === "fulfilled" ? (todayOrdersR.value[0]?.count  ?? 0) : 0;
    const yesterdayOrders = yesterdayOrdersR.status === "fulfilled" ? (yesterdayOrdersR.value[0]?.count ?? 0) : 0;
    const todayRevenue    = Number(todayRevR.status === "fulfilled" ? todayRevR.value[0]?.total ?? 0 : 0);
    const yesterdayRevenue = Number(yesterdayRevR.status === "fulfilled" ? yesterdayRevR.value[0]?.total ?? 0 : 0);
    const prodData        = productsR.status     === "fulfilled" ? productsR.value.result[0]     : null;
    const totalProducts   = prodData?.count      ?? 0;
    const lowStock        = prodData?.lowStock   ?? 0;
    const outOfStock      = prodData?.outOfStock ?? 0;
    const activeSessions  = sessionsR.status     === "fulfilled" ? (sessionsR.value[0]?.count ?? 0) : 0;
    const cartUsers       = cartR.status         === "fulfilled" ? (cartR.value[0]?.count    ?? 0) : 0;
    const newUsersToday   = newUsersR.status     === "fulfilled" ? (newUsersR.value[0]?.count ?? 0) : 0;
    const cartAbandonmentRate = cartUsers > 0 ? Math.round((cartUsers / (cartUsers + todayOrders || 1)) * 100) : 0;

    const memUsage   = process.memoryUsage();
    const memUsedMB  = Math.round(memUsage.heapUsed  / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercent = Math.round((memUsedMB / memTotalMB) * 100);
    const uptimeSec  = Math.floor(process.uptime());
    const apiMs      = Math.round(performance.now());

    let score = 100;
    if (dbPing > 2000)        score -= 20;
    else if (dbPing > 1000)   score -= 10;
    else if (dbPing > 500)    score -= 5;
    if (memPercent > 95)      score -= 8;
    else if (memPercent > 85) score -= 4;
    if (failedPct > 20)       score -= 15;
    else if (failedPct > 10)  score -= 5;
    if (outOfStock > totalProducts * 0.3) score -= 8;
    if (lowStock > 5)         score -= 4;
    if (!ssl.valid)           score -= 8;
    if (!seoFiles.sitemapOk)  score -= 3;
    if (!seoFiles.robotsOk)   score -= 2;
    const slowPages = pageLoads.filter((p) => p.ms > 3000).length;
    score -= slowPages * 3;
    score = Math.max(0, Math.min(100, score));

    return NextResponse.json(
      {
        timestamp: now.toISOString(),
        score,
        overallStatus: scoreToGrade(score),
        pagespeedConfigured: !!process.env.PAGESPEED_API_KEY?.trim(),
        database: {
          status: msToGrade(dbPing, 300, 1000),
          pingMs: dbPing, usersQueryMs, ordersQueryMs, productsQueryMs,
          connected: dbPingR.status === "fulfilled",
        },
        server: {
          status: memPercent > 95 ? "poor" : memPercent > 80 ? "fair" : "excellent",
          memUsedMB, memTotalMB, memPercent,
          uptimeHours: Math.floor(uptimeSec / 3600),
          uptimeMinutes: Math.floor((uptimeSec % 3600) / 60),
          apiResponseMs: apiMs,
          nodeVersion: process.version,
        },
        business: {
          totalUsers, newUsersToday, totalOrders, todayOrders, yesterdayOrders,
          ordersGrowth: calcGrowth(todayOrders, yesterdayOrders),
          todayRevenue, yesterdayRevenue,
          revenueGrowth: calcGrowth(todayRevenue, yesterdayRevenue),
          failedOrders, failedOrdersPercent: failedPct,
          totalProducts, lowStockProducts: lowStock, outOfStockProducts: outOfStock,
          activeSessionCount: activeSessions, cartAbandonmentRate,
        },
        pageLoads,
        ssl,
        seo: {
          sitemapOk: seoFiles.sitemapOk, robotsOk: seoFiles.robotsOk,
          sitemapStatus: seoFiles.sitemapStatus, robotsStatus: seoFiles.robotsStatus,
        },
        services: {
          database:   process.env.DATABASE_URL && dbPingR.status === "fulfilled" ? "operational" : "degraded",
          pusher:     process.env.PUSHER_APP_ID && process.env.PUSHER_KEY ? "configured" : "not_configured",
          cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "not_configured",
          email:      process.env.SMTP_USER || process.env.SMTP_PASS ? "configured" : "not_configured",
          nextAuth:   session ? "operational" : "degraded",
          ssl:        ssl.valid ? "operational" : "degraded",
        },
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("[Health API] Fatal error:", error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        score: 0,
        overallStatus: "poor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}