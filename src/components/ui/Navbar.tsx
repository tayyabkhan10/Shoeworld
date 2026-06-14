// 📁 src/components/ui/Navbar.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react"; // ✅ NextAuth hooks
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  BookOpen,
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

const ADMIN_EMAIL = "nailaanjum1530@gmail.com";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession(); // ✅ NextAuth session
  const { data: cart } = useGetCart({ enabled: status === "authenticated" });
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const user = session?.user;
  const isSignedIn = status === "authenticated";
  const isAdmin = user?.role === "admin" || user?.email === ADMIN_EMAIL;

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
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0" aria-label="Adnan Shoes Home">
            <span className="font-serif text-[22px] font-bold tracking-tight text-foreground">
              Soft Chappal<span className="text-foreground/40">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-medium tracking-wide transition-colors link-line ${
                  pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <Link href="/shop" aria-label="Search products">
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            {/* ✅ Signed In Section */}
            {isSignedIn && (
              <>
                <Link href="/cart" aria-label={`Cart`}>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <ShoppingBag className="h-4 w-4" />
                    {cart?.itemCount ? (
                      <span className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                        {cart.itemCount > 9 ? "9+" : cart.itemCount}
                      </span>
                    ) : null}
                  </Button>
                </Link>

                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Account menu">
                        <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold">
                          {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal py-2">
                        <p className="text-sm font-semibold truncate">{user?.name ?? "My Account"}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/orders">
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          <Package className="h-4 w-4" />My Orders
                        </DropdownMenuItem>
                      </Link>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <Link href="/admin">
                            <DropdownMenuItem className="cursor-pointer gap-2 font-medium">
                              <LayoutDashboard className="h-4 w-4" />Admin Panel
                            </DropdownMenuItem>
                          </Link>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer gap-2 text-destructive" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />Log Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            {/* ✅ Signed Out Section */}
            {!isSignedIn && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:flex h-9 gap-1.5 text-[13px]"
                  onClick={() => signIn(undefined, { callbackUrl: pathname })}
                >
                  <User className="h-4 w-4" />Sign In
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-white border-t md:hidden overflow-y-auto">
          <div className="px-6 py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <div className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href ? "bg-foreground text-background" : "hover:bg-muted"
                }`}>
                  {link.label}
                </div>
              </Link>
            ))}

            {isSignedIn ? (
              <div className="border-t border-border mt-5 pt-5 space-y-1">
                <Link href="/cart" onClick={() => setMobileOpen(false)}>
                  <div className="px-4 py-3 text-sm font-medium hover:bg-muted flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4" />Cart {cart?.itemCount ? `(${cart.itemCount})` : ""}
                  </div>
                </Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)}>
                  <div className="px-4 py-3 text-sm font-medium hover:bg-muted flex items-center gap-3">
                    <Package className="h-4 w-4" />My Orders
                  </div>
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <div className="px-4 py-3 text-sm font-semibold hover:bg-muted flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4" />Admin Panel
                    </div>
                  </Link>
                )}
                <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-muted flex items-center gap-3 text-destructive">
                  <LogOut className="h-4 w-4" />Log Out
                </button>
              </div>
            ) : (
              <div className="border-t border-border mt-5 pt-5">
                <Button 
                  className="w-full h-12 text-sm font-semibold"
                  onClick={() => {
                    setMobileOpen(false);
                    signIn(undefined, { callbackUrl: pathname });
                  }}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}