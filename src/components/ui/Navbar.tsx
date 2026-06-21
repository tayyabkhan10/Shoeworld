


'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCart } from "@/hooks/api";



import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
});


const ADMIN_EMAIL = "soft-chappal@gmail.com";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { data: cart } = useGetCart({ enabled: status === "authenticated" });
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const isSignedIn = status === "authenticated";
  const isAdmin = user?.email === ADMIN_EMAIL;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/journal", label: "Journal" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const handleSignOut = () => {
    setMobileOpen(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* ── WHITE GLASS NAVBAR, FIXED ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <div className="max-w-4xl mx-auto px-4 pt-4 md:px-8">
          <div className="flex items-center justify-between px-6 py-2.5 rounded-full border backdrop-blur-xl border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] transition-all duration-300">

            {/* Logo */}
            <Link href="/" className="shrink-0 relative z-50" aria-label="Soft Chappal Home">
              <span className={` ${orbitron.className}  text-[22px] font-bold tracking-widest text-neutral-900 drop-shadow-sm`}>
                Soft Chappal
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-bold tracking-widest transition-all relative group ${
                    pathname === link.href
                      ? "text-neutral-900"
                      : "text-neutral-600 hover:text-neutral-900 hover:scale-105"
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-neutral-900 to-neutral-500 transition-all duration-300 ${
                    pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                  }`}></span>
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Link href="/shop" aria-label="Search products">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-9 w-9 text-neutral-600 hover:text-neutral-900 hover:bg-white/60 rounded-full transition-all"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </Link>

              {/* ✅ Signed In Section */}
              {isSignedIn && (
                <>
                  {/* Cart */}
                  <Link href="/cart" aria-label="Cart">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9 text-neutral-600 hover:text-neutral-900 hover:bg-white/60 rounded-full transition-all"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      {cart?.itemCount ? (
                        <span className="absolute top-0.5 right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.25)]">
                          {cart.itemCount > 9 ? "9+" : cart.itemCount}
                        </span>
                      ) : null}
                    </Button>
                  </Link>

                  {/* User Dropdown */}
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full transition-all hover:scale-110"
                          aria-label="Account menu"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 text-white flex items-center justify-center text-[11px] font-bold border border-white/50 shadow-[0_0_15px_rgba(0,0,0,0.15)]">
                            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="liquid-glass-panel w-56 border-0 text-neutral-900 p-0 overflow-hidden"
                      >
                        {/* Liquid glass shine layers */}
                        <div className="liquid-glass-shine" />
                        <div className="liquid-glass-noise" />

                        <div className="relative z-10 p-1">
                          <DropdownMenuLabel className="font-normal py-2.5 px-3 text-neutral-900">
                            <p className="text-sm font-semibold truncate">{user?.name ?? "My Account"}</p>
                            <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email}</p>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/40" />
                          <Link href="/orders">
                            <DropdownMenuItem className="liquid-glass-item cursor-pointer gap-2 text-neutral-700 focus:text-neutral-900 rounded-xl mx-1 my-0.5">
                              <Package className="h-4 w-4" />My Orders
                            </DropdownMenuItem>
                          </Link>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator className="bg-white/40" />
                              <Link href="/admin">
                                <DropdownMenuItem className="liquid-glass-item cursor-pointer gap-2 font-medium text-neutral-700 focus:text-neutral-900 rounded-xl mx-1 my-0.5">
                                  <LayoutDashboard className="h-4 w-4" />Admin Panel
                                </DropdownMenuItem>
                              </Link>
                            </>
                          )}
                          <DropdownMenuSeparator className="bg-white/40" />
                          <DropdownMenuItem
                            className="liquid-glass-item cursor-pointer gap-2 text-neutral-700 focus:text-neutral-900 rounded-xl mx-1 my-0.5"
                            onClick={handleSignOut}
                          >
                            <LogOut className="h-4 w-4" />Log Out
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}

              {/* ✅ Signed Out Section */}
              {!isSignedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex h-9 px-5 gap-1.5 text-xs font-bold tracking-widest text-white bg-gradient-to-r from-neutral-900 to-neutral-700 border border-white/30 rounded-full hover:from-neutral-800 hover:to-neutral-600 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                  onClick={() => signIn(undefined, { callbackUrl: pathname })}
                >
                  <User className="h-4 w-4" />LOGIN
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-neutral-700 hover:text-neutral-900 hover:bg-white/60 rounded-full transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU - WHITE GLASS THEME ──────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 top-0 z-40 bg-gradient-to-b from-white/98 to-neutral-50/95 backdrop-blur-xl md:hidden overflow-y-auto">
          <div className="px-6 pt-6 pb-8 flex flex-col min-h-screen">
            {/* Mobile Header */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-200/60">
              <span className="text-[22px] font-bold tracking-tight text-neutral-900">
                Soft Chappal<span className="text-neutral-400">.</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full bg-white/60 border border-neutral-200/60 text-neutral-700 hover:bg-white/90 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 flex flex-col justify-center gap-2 py-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <div className={`group flex items-center justify-between px-5 py-4 rounded-2xl text-base font-medium transition-all ${
                    pathname === link.href
                      ? "bg-gradient-to-r from-neutral-900/10 to-neutral-700/10 text-neutral-900 border border-neutral-300/50"
                      : "text-neutral-600 hover:bg-white/60 hover:text-neutral-900 border border-transparent"
                  }`}>
                    <span className="tracking-wide">{link.label}</span>
                    <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-6 border-t border-neutral-200/60">
              {isSignedIn ? (
                <>
                  <Link href="/cart" onClick={() => setMobileOpen(false)}>
                    <div className="px-5 py-4 rounded-2xl text-sm font-medium text-neutral-700 hover:bg-white/60 hover:text-neutral-900 flex items-center justify-between border border-neutral-200/50 transition-all">
                      <span className="flex items-center gap-3">
                        <ShoppingBag className="h-4 w-4" />Cart
                      </span>
                      {cart?.itemCount ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-700 text-white text-xs font-bold">
                          {cart.itemCount}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                  <Link href="/orders" onClick={() => setMobileOpen(false)}>
                    <div className="px-5 py-4 rounded-2xl text-sm font-medium text-neutral-700 hover:bg-white/60 hover:text-neutral-900 flex items-center gap-3 border border-neutral-200/50 transition-all">
                      <Package className="h-4 w-4" />My Orders
                    </div>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <div className="px-5 py-4 rounded-2xl text-sm font-semibold text-neutral-900 hover:bg-white/60 flex items-center gap-3 border border-neutral-300/50 transition-all">
                        <LayoutDashboard className="h-4 w-4" />Admin Panel
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full px-5 py-4 rounded-2xl text-sm font-medium text-neutral-700 hover:bg-white/60 hover:text-neutral-900 flex items-center gap-3 border border-neutral-200/50 transition-all"
                  >
                    <LogOut className="h-4 w-4" />Log Out
                  </button>
                </>
              ) : (
                <Button
                  className="w-full h-12 text-sm font-bold tracking-widest bg-gradient-to-r from-neutral-900 to-neutral-700 text-white border border-white/30 rounded-2xl hover:from-neutral-800 hover:to-neutral-600 transition-all shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                  onClick={() => {
                    setMobileOpen(false);
                    signIn(undefined, { callbackUrl: pathname });
                  }}
                >
                  SIGN IN
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIQUID GLASS STYLES ──────────────────────────────────── */}
      <style>{`
        /* The dropdown panel itself: frosted, translucent, layered like iOS glass */
        .liquid-glass-panel {
          position: relative;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.25) 100%
          );
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-radius: 20px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 1px 1px rgba(255, 255, 255, 0.8) inset,
            0 -1px 1px rgba(0, 0, 0, 0.04) inset;
          border: 1px solid rgba(255, 255, 255, 0.6);
          animation: liquidPanelIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes liquidPanelIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(-6px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        /* Moving sheen across the glass, like light catching a droplet */
        .liquid-glass-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.55) 38%,
            rgba(255, 255, 255, 0.15) 48%,
            transparent 60%
          );
          background-size: 250% 250%;
          background-position: 0% 0%;
          mix-blend-mode: overlay;
          animation: liquidSheenSweep 3.2s ease-in-out infinite;
        }

        @keyframes liquidSheenSweep {
          0% { background-position: 120% -20%; }
          50% { background-position: -20% 120%; }
          100% { background-position: 120% -20%; }
        }

        /* Subtle grain so the glass doesn't look like flat plastic */
        .liquid-glass-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 45%),
                             radial-gradient(circle at 80% 75%, rgba(255,255,255,0.3) 0%, transparent 50%);
        }

        /* Simple clean hover — no droplet/ripple effects */
        .liquid-glass-item {
          position: relative;
          transition: background 0.2s ease;
        }

        .liquid-glass-item:hover,
        .liquid-glass-item:focus {
          background: rgba(255, 255, 255, 0.4) !important;
        }
      `}</style>
    </>
  );
}