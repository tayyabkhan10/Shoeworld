// 📁 src/app/api/admin/health/pagespeed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PSResult = {
  strategy: string; performance: number; seo: number; accessibility: number; bestPractices: number;
  fcp: string; lcp: string; cls: string; tbt: string; speedIndex: string; ttfb: string;
};

// In-memory cache (per server instance) — avoids re-hitting Google on every click
const cache = new Map<string, { data: PSResult; expires: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

async function fetchPageSpeed(strategy: "mobile" | "desktop", key: string, url: string): Promise<PSResult | null> {
  const categories = ["performance", "seo", "accessibility", "best-practices"];
  const fullUrl =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?` +
    `url=${encodeURIComponent(url)}&strategy=${strategy}&key=${encodeURIComponent(key)}` +
    categories.map((c) => `&category=${c}`).join("");

  const res = await fetch(fullUrl, { signal: AbortSignal.timeout(60000), headers: { Accept: "application/json" } });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`PageSpeed HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const cats = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits;
  if (!cats) throw new Error("No categories in PageSpeed response");

  return {
    strategy,
    performance:   Math.round((cats?.performance?.score   ?? 0) * 100),
    seo:           Math.round((cats?.seo?.score           ?? 0) * 100),
    accessibility: Math.round((cats?.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cats?.["best-practices"]?.score ?? 0) * 100),
    fcp: audits?.["first-contentful-paint"]?.displayValue   ?? "N/A",
    lcp: audits?.["largest-contentful-paint"]?.displayValue ?? "N/A",
    cls: audits?.["cumulative-layout-shift"]?.displayValue  ?? "N/A",
    tbt: audits?.["total-blocking-time"]?.displayValue      ?? "N/A",
    speedIndex: audits?.["speed-index"]?.displayValue       ?? "N/A",
    ttfb: audits?.["server-response-time"]?.displayValue    ?? "N/A",
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const strategy = (searchParams.get("strategy") === "desktop" ? "desktop" : "mobile") as "mobile" | "desktop";
  const force = searchParams.get("force") === "1";
  const key = process.env.PAGESPEED_API_KEY?.trim() ?? "";

  if (!key) {
    return NextResponse.json({ error: "PAGESPEED_API_KEY missing on server", configured: false }, { status: 200 });
  }

  // PageSpeed/Lighthouse runs on Google's servers — it can NEVER reach
  // localhost or 127.0.0.1. Always test the public production URL,
  // regardless of what NEXT_PUBLIC_BASE_URL is set to locally.
  const rawUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const isLocal = !rawUrl || /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(rawUrl);
  const BASE_URL = isLocal ? "https://soft-chappal.vercel.app" : rawUrl;

  if (isLocal) {
    console.warn("[PageSpeed] NEXT_PUBLIC_BASE_URL is local/unset — testing production URL instead:", BASE_URL);
  }

  const cacheKey = `${strategy}:${BASE_URL}`;
  const cached = cache.get(cacheKey);
  if (!force && cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.data, cached: true, testedUrl: BASE_URL, isLocal });
  }

  try {
    const data = await fetchPageSpeed(strategy, key, BASE_URL);
    if (data) cache.set(cacheKey, { data, expires: Date.now() + TTL_MS });
    return NextResponse.json({ data, cached: false, testedUrl: BASE_URL, isLocal });
  } catch (e) {
    console.error("[PageSpeed]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "PageSpeed request failed" }, { status: 200 });
  }
}