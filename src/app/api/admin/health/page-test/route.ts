// 📁 src/app/api/admin/health/page-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { msToGrade } from "@/lib/website-health-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";

  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "SoftChappal-HealthBot/1.0" },
      cache: "no-store",
    });
    const ms = Math.round(performance.now() - start);
    return NextResponse.json({ path, ms, httpStatus: res.status, ok: res.ok, grade: msToGrade(ms, 800, 2000) });
  } catch {
    return NextResponse.json({ path, ms: 9999, httpStatus: 0, ok: false, grade: "poor" });
  }
}