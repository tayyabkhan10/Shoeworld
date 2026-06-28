'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, LogOut, ChevronRight, Store, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
});

const navItems = [
  { href: "/admin",            label: "Overview",   icon: LayoutDashboard },
  { href: "/admin/products",   label: "Products",   icon: Package },
  { href: "/admin/orders",     label: "Orders",     icon: ShoppingCart },
  { href: "/admin/customers",  label: "Customers",  icon: Users },
  { href: "/admin/health",     label: "Health",     icon: Activity },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-200 flex-col shadow-sm h-screen sticky top-0 overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-5 w-5 text-gray-700" />
            <span className={`${orbitron.className} tracking-[3px] font-serif text-lg font-bold text-gray-900`}>
              Kashan Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}>
                  <item.icon className={`h-4 w-4 shrink-0 ${
                    active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                  }`} />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-white/60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4 shrink-0">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2 text-xs"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
          <Link href="/">
            <div className="mt-1 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-700 cursor-pointer flex items-center gap-1.5 rounded-md hover:bg-gray-50 transition-colors">
              <Store className="h-3.5 w-3.5" /> Back to Store
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 gap-4 shrink-0 z-10 shadow-sm">
          <div className="flex-1">
            <p className="text-sm text-gray-400">
              {navItems.find((n) => n.href === pathname)?.label ?? "Admin"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-gray-900" : "text-gray-400"}`} />
              <span className={`text-[10px] mt-1 font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}