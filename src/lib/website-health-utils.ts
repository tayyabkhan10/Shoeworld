// // 📁 src/lib/website-health-utils.ts

// export const WEBSITE_PAGES = [
//   { name: "Home",      path: "/",           important: true  },
//   { name: "Shop",      path: "/shop",        important: true  },
//   { name: "Cart",      path: "/cart",        important: true  },
//   { name: "Checkout",  path: "/checkout",    important: true  },
//   { name: "About",     path: "/about",       important: false },
//   { name: "Contact",   path: "/contact",     important: false },
//   { name: "Journal",   path: "/journal",     important: false },
//   { name: "Chat",      path: "/chat",        important: false },
//   { name: "Developer", path: "/developer",   important: false },
//   { name: "Admin",     path: "/admin",       important: false },
// ];

// export type HealthGrade = "excellent" | "good" | "fair" | "poor";

// export function msToGrade(ms: number, good = 300, fair = 800): HealthGrade {
//   if (ms < good)     return "excellent";
//   if (ms < fair)     return "good";
//   if (ms < fair * 2) return "fair";
//   return "poor";
// }

// export function percentToGrade(pct: number, goodBelow = 50, fairBelow = 75): HealthGrade {
//   if (pct < goodBelow) return "excellent";
//   if (pct < fairBelow) return "good";
//   if (pct < 90)        return "fair";
//   return "poor";
// }

// export function scoreToGrade(score: number): HealthGrade {
//   if (score >= 90) return "excellent";
//   if (score >= 70) return "good";
//   if (score >= 50) return "fair";
//   return "poor";
// }

// export function calcGrowth(today: number, yesterday: number) {
//   if (yesterday === 0) return today > 0 ? 100 : 0;
//   return Math.round(((today - yesterday) / yesterday) * 100);
// }

// // ── Light "StarAdmin" style palette ─────────────────────────
// export const GRADE_COLORS: Record<HealthGrade, { hex: string; soft: string; tailwindText: string; tailwindBg: string; tailwindBorder: string; tailwindBadge: string }> = {
//   excellent: { hex: "#22c55e", soft: "#ecfdf3", tailwindText: "text-emerald-600", tailwindBg: "bg-emerald-50", tailwindBorder: "border-emerald-200", tailwindBadge: "bg-emerald-100 text-emerald-700" },
//   good:      { hex: "#3b82f6", soft: "#eff6ff", tailwindText: "text-blue-600",    tailwindBg: "bg-blue-50",    tailwindBorder: "border-blue-200",    tailwindBadge: "bg-blue-100 text-blue-700"    },
//   fair:      { hex: "#f59e0b", soft: "#fffbeb", tailwindText: "text-amber-600",   tailwindBg: "bg-amber-50",   tailwindBorder: "border-amber-200",   tailwindBadge: "bg-amber-100 text-amber-700"  },
//   poor:      { hex: "#ef4444", soft: "#fef2f2", tailwindText: "text-red-600",     tailwindBg: "bg-red-50",     tailwindBorder: "border-red-200",     tailwindBadge: "bg-red-100 text-red-700"      },
// };

// // Primary brand palette taken from the reference dashboards (indigo/blue/pink)
// export const BRAND = {
//   primary: "#5b6cf0",
//   primarySoft: "#eef0ff",
//   pink: "#ec4899",
//   pinkSoft: "#fdf2f8",
//   teal: "#14b8a6",
//   tealSoft: "#f0fdfa",
//   amber: "#f59e0b",
//   amberSoft: "#fffbeb",
//   ink: "#1e2147",
//   sub: "#8b8fa3",
//   grid: "#eef0f4",
//   card: "#ffffff",
//   pageBg: "#f5f6fa",
// };

// export const PAGE_CHART_COLORS = [
//   "#5b6cf0", "#f59e0b", "#22c55e", "#3b82f6",
//   "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
//   "#06b6d4", "#84cc16",
// ];


// 📁 src/lib/website-health-utils.ts

export const WEBSITE_PAGES = [
  { name: "Home",      path: "/",           important: true  },
  { name: "Shop",      path: "/shop",        important: true  },
  { name: "Cart",      path: "/cart",        important: true  },
  { name: "Checkout",  path: "/checkout",    important: true  },
  { name: "About",     path: "/about",       important: false },
  { name: "Contact",   path: "/contact",     important: false },
  { name: "Journal",   path: "/journal",     important: false },
  { name: "Chat",      path: "/chat",        important: false },
  { name: "Developer", path: "/developer",   important: false },
  { name: "Admin",     path: "/admin",       important: false },
];

export type HealthGrade = "excellent" | "good" | "fair" | "poor";

export function msToGrade(ms: number, good = 300, fair = 800): HealthGrade {
  if (ms < good)     return "excellent";
  if (ms < fair)     return "good";
  if (ms < fair * 2) return "fair";
  return "poor";
}

export function percentToGrade(pct: number, goodBelow = 50, fairBelow = 75): HealthGrade {
  if (pct < goodBelow) return "excellent";
  if (pct < fairBelow) return "good";
  if (pct < 90)        return "fair";
  return "poor";
}

export function scoreToGrade(score: number): HealthGrade {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

export function calcGrowth(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

// ── Refined "deep control-panel" palette ────────────────────
// Slightly deeper, richer tones than flat Tailwind defaults so
// status colors read as intentional rather than generic alert colors.
export const GRADE_COLORS: Record<HealthGrade, { hex: string; soft: string; tailwindText: string; tailwindBg: string; tailwindBorder: string; tailwindBadge: string }> = {
  excellent: { hex: "#16a34a", soft: "#ecfdf5", tailwindText: "text-emerald-700", tailwindBg: "bg-emerald-50", tailwindBorder: "border-emerald-200", tailwindBadge: "bg-emerald-100 text-emerald-700" },
  good:      { hex: "#2563eb", soft: "#eff6ff", tailwindText: "text-blue-700",    tailwindBg: "bg-blue-50",    tailwindBorder: "border-blue-200",    tailwindBadge: "bg-blue-100 text-blue-700"    },
  fair:      { hex: "#d97706", soft: "#fffbeb", tailwindText: "text-amber-700",   tailwindBg: "bg-amber-50",   tailwindBorder: "border-amber-200",   tailwindBadge: "bg-amber-100 text-amber-700"  },
  poor:      { hex: "#dc2626", soft: "#fef2f2", tailwindText: "text-red-700",     tailwindBg: "bg-red-50",     tailwindBorder: "border-red-200",     tailwindBadge: "bg-red-100 text-red-700"      },
};

// Primary brand palette — deep indigo/navy base with a tighter,
// more saturated accent set than generic dashboard defaults.
export const BRAND = {
  primary: "#4f46e5",
  primarySoft: "#eef0ff",
  pink: "#db2777",
  pinkSoft: "#fdf2f8",
  teal: "#0d9488",
  tealSoft: "#f0fdfa",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  ink: "#13152b",
  sub: "#7d81a0",
  grid: "#ebecf3",
  card: "#ffffff",
  pageBg: "#f3f4f9",
};

export const PAGE_CHART_COLORS = [
  "#4f46e5", "#d97706", "#16a34a", "#2563eb",
  "#db2777", "#0d9488", "#ea580c", "#7c3aed",
  "#0891b2", "#65a30d",
];