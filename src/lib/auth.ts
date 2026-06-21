// 📁 src/lib/auth.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  usersTable, accountsTable, sessionsTable, verificationTokensTable
} from "@/lib/schema";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { sendOtpVerificationEmail } from "@/lib/mailer";

const ADMIN_EMAIL = "soft-chappal@gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);

        if (!user) throw new Error("No account found with this email");
        if (!user.password) throw new Error("Use Google to sign in");

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Invalid password");

        if (!user.emailVerified) throw new Error("Email not verified. Please verify your email first.");

        return {
          ...user,
          role: user.role as "user" | "admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On first sign in, user object is present
      if (user?.id) {
        token.id = user.id;
        token.email = user.email;

        // ✅ Always fetch fresh role from DB — don't trust the user object alone
        const [dbUser] = await db
          .select({ role: usersTable.role })
          .from(usersTable)
          .where(eq(usersTable.id, user.id))
          .limit(1);

        token.role = (dbUser?.role ?? "user") as "user" | "admin";
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // ✅ Auto-assign admin role on account creation
      if (user.email === ADMIN_EMAIL) {
        await db
          .update(usersTable)
          .set({ role: "admin" })
          .where(eq(usersTable.id, user.id));
      }
    },
    async signIn({ user }) {
      // ✅ Also ensure admin role on every sign in (covers credentials login)
      if (user.email === ADMIN_EMAIL) {
        const [dbUser] = await db
          .select({ role: usersTable.role })
          .from(usersTable)
          .where(eq(usersTable.id, user.id!))
          .limit(1);

        if (dbUser?.role !== "admin") {
          await db
            .update(usersTable)
            .set({ role: "admin" })
            .where(eq(usersTable.id, user.id!));
        }
      }
    },
  },
});