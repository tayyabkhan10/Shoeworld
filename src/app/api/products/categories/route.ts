import { db } from "@/lib/db";
import { productsTable } from "@/lib/schema";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        name: productsTable.category,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(productsTable)
      .groupBy(productsTable.category);

    return NextResponse.json(
      rows.map((r) => ({ name: r.name, count: Number(r.count) }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}