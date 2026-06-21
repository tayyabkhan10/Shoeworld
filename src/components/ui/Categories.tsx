import Link from "next/link"
import { ArrowRight } from "lucide-react";

const categories = [
  { href: "/shop?category=boots", img: "/images/boots.png", label: "Boots", desc: "Bold & Durable" },
  { href: "/shop?category=sneakers", img: "/images/sneakers.png", label: "Sneakers", desc: "Casual & Comfortable" },
  { href: "/shop?category=loafers", img: "/images/loafers.png", label: "Loafers", desc: "Smart & Refined" },
];

export default function Categories() {
  return (
    <section className="py-16 sm:py-28" aria-label="Shop by category">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Browse</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Shop by Category</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`group relative overflow-hidden flex items-end p-5 sm:p-8 img-zoom
                ${i === 2 ? "col-span-2 md:col-span-1" : "col-span-1"}
              `}
              style={{ height: "clamp(220px, 40vw, 440px)" }}
              aria-label={`Shop ${cat.label}`}
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />
              <div className="relative z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.15em] mb-1">{cat.desc}</p>
                <h3 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">{cat.label}</h3>
                <span className="inline-flex items-center text-white/70 text-xs sm:text-sm font-medium group-hover:text-white transition-colors gap-1.5">
                  Explore <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}