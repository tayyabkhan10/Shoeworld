

// 📁 src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = "soft-chappal@gmail.com";
const ADMIN_COOKIE = "admin_session";

// ── Admin cookie verify karo (jose use karta hai — edge compatible) ──
async function verifyAdminCookie(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Admin login page aur auth API — hamesha allow karo
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  // ── Admin Routes ───────────────────────────────────────────
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin");

  if (isAdminRoute) {
    const admin = await verifyAdminCookie(req);

    if (!admin) {
      // Token nahi — login page par bhejo
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const isAdmin =
      admin.role === "admin" || admin.email === ADMIN_EMAIL;

    if (!isAdmin) {
      // Token hai lekin admin nahi
      return NextResponse.redirect(
        new URL("/admin/login?error=unauthorized", req.url)
      );
    }

    return NextResponse.next();
  }

  // ── Regular Protected Routes (NextAuth) ────────────────────
  const isProtectedRoute =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/account");

  if (isProtectedRoute) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};