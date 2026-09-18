import { db } from "@/lib/db";
import { productsTable } from "@/lib/schema";
import { NextResponse } from "next/server";
import { eq, ilike, gte, lte, and, arrayOverlaps, type SQL } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";

function toProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id, name: p.name, description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
    category: p.category, imageUrl: p.imageUrl,
    additionalImages: p.additionalImages ?? [],
    sizes: p.sizes ?? [], colors: p.colors ?? [],
    inStock: p.inStock, stockCount: p.stockCount,
    featured: p.featured,
    rating: p.rating != null ? Number(p.rating) : null,
    reviewCount: p.reviewCount,
    createdAt: p.createdAt.toISOString(),
  };
}

const ListParams = z.object({
  search: z.string().optional(), category: z.string().optional(),
  minPrice: z.coerce.number().optional(), maxPrice: z.coerce.number().optional(),
  featured: z.coerce.boolean().optional(), size: z.string().optional(),
  color: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = ListParams.parse(Object.fromEntries(url.searchParams.entries()));

    const conditions: SQL[] = [];
    if (q.category) conditions.push(eq(productsTable.category, q.category));
    if (q.search) conditions.push(ilike(productsTable.name, `%${q.search}%`));
    if (q.minPrice != null) conditions.push(gte(productsTable.price, String(q.minPrice)));
    if (q.maxPrice != null) conditions.push(lte(productsTable.price, String(q.maxPrice)));
    if (q.featured != null) conditions.push(eq(productsTable.featured, q.featured));
    // size/color filtering now happens in SQL, not in JS after fetch
    if (q.size) conditions.push(arrayOverlaps(productsTable.sizes, [q.size]));
    if (q.color) conditions.push(arrayOverlaps(productsTable.colors, [q.color]));

    const limit = q.limit ?? 60;
    const offset = q.offset ?? 0;

    const products = await db
      .select()
      .from(productsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(products.map(toProduct));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const CreateBody = z.object({
      name: z.string().min(1), description: z.string().optional(),
      price: z.number().positive(), originalPrice: z.number().positive().optional(),
      category: z.string().min(1), imageUrl: z.string().url(),
      additionalImages: z.array(z.string()).optional(),
      sizes: z.array(z.string()), colors: z.array(z.string()),
      stockCount: z.number().int().min(0).optional(), featured: z.boolean().optional(),
    });

    const body = await request.json();
    const data = CreateBody.parse(body);

    const [product] = await db.insert(productsTable).values({
      ...data,
      price: String(data.price),
      originalPrice: data.originalPrice != null ? String(data.originalPrice) : null,
      stockCount: data.stockCount ?? 0,
      inStock: (data.stockCount ?? 0) > 0,
      featured: data.featured ?? false,
      additionalImages: data.additionalImages ?? [],
    }).returning();

    return NextResponse.json(toProduct(product), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}