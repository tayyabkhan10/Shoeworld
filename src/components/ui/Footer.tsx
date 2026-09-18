'use client';
import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube ,  } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-3xl font-bold tracking-tighter mb-4">
              Shoe World<span className="opacity-60">.</span>
            </h3>
            <p className="text-primary-foreground/70 max-w-sm mb-6 leading-relaxed">
              Premium footwear crafted with intention. Step into confidence with our curated collection of boots, sneakers, and formal shoes.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/softchappalofficial?igsh=aDhvcm9yd20yeDc%3D&utm_source=qr" },
                { Icon: Twitter, href: "#" },
                { Icon: Facebook, href: "#" },
                { Icon: Youtube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="h-9 w-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop?category=boots" className="hover:text-white transition-colors">Boots</Link></li>
              <li><Link href="/shop?category=sneakers" className="hover:text-white transition-colors">Sneakers</Link></li>
              <li><Link href="/shop?category=loafers" className="hover:text-white transition-colors">Loafers</Link></li>
              <li><Link href="/shop?category=formal" className="hover:text-white transition-colors">Formal</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-3 text-primary-foreground/70 text-sm">
              <li><Link href="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-primary-foreground/50 gap-4">
        <div>
           <p>&copy; {new Date().getFullYear()} Shoe World. All rights reserved.</p><br/>
          <p>Architected, Designed, and Programmed from scratch by Tayyab Khan | Full-Stack Developer</p>
        </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
