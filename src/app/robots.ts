// 📁 src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",        // Sab crawlers
        allow: "/",
        disallow: [
          "/api/",             // API routes crawl mat karo
          "/admin/",           // Admin pages
          "/_next/",           // Next.js internal
          "/checkout",         // Checkout page
          "/account",          // User account
          "/*?*sort*",         // Filter/sort URLs (duplicate content)
          "/*?*page=*",        // Pagination (optional)
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",            // Google ko full access
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}