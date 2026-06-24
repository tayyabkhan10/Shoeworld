// 📁 src/app/sitemap.ts
import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://soft-chappal.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ✅ Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,           // Homepage — sabse important
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ✅ Dynamic product pages (API se fetch karo)
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      next: { revalidate: 3600 }, // 1 hour cache
    });
    const products = await res.json();

    productPages = products.map((product: { id: string; updatedAt?: string }) => ({
      url: `${BASE_URL}/product/${product.id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // API fail ho to sirf static pages return karein
  }

  return [...staticPages, ...productPages];
}