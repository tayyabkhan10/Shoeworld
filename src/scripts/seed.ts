// 📁 src/scripts/seed.ts
// Run: npx tsx src/scripts/seed.ts

import { db } from "@/lib/db";
import { usersTable, productsTable } from "@/lib/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "soft-chappal@gmail.com";
const ADMIN_PASSWORD = "soft-chappal@123#admin"; // ⚠️ Change this after seeding!

async function seedAdmin() {
  console.log("👤 Admin user seed kar raha hun...");

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (!existing) {
    await db.insert(usersTable).values({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      emailVerified: new Date(),
    });
    console.log("✅ Admin user create ho gaya!");
  } else {
    // Already exists — role aur password update karo
    await db
      .update(usersTable)
      .set({
        role: "admin",
        password: hashedPassword,
        emailVerified: new Date(),
      })
      .where(eq(usersTable.email, ADMIN_EMAIL));
    console.log("✅ Admin user update ho gaya!");
  }

  console.log("   📧 Email:", ADMIN_EMAIL);
  console.log("   🔑 Password:", ADMIN_PASSWORD);
}



async function main() {
  console.log("🌱 Database seed shuru...\n");

  await seedAdmin();
 

  console.log("\n🎉 Seeding complete!");
  console.log("⚠️  IMPORTANT: Admin password change kar lo production mein!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});