"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useGetFeaturedProducts } from "@/hooks/api";
import  WhatsAppButton  from "@/components/WhatsAppButton"
import { ProductCard } from "@/components/shared/ProductCard";
import { Star, Truck, RefreshCw, Shield, Award, ArrowRight } from "lucide-react";

const testimonials = [
  {
    name: "Sara Ahmed",
    role: "Fashion Blogger, Lahore",
    text: "Adnan Shoes has completely redefined premium footwear in Pakistan. The quality is unmatched — every pair I've bought has lasted for years.",
    rating: 5,
    avatar: "SA",
  },
  {
    name: "Ali Hassan",
    role: "Architect, Karachi",
    text: "I wear their boots to client meetings every day. Incredibly comfortable and stylish — I get compliments constantly. Worth every rupee.",
    rating: 5,
    avatar: "AH",
  },
  {
    name: "Fatima Khan",
    role: "Marketing Director, Islamabad",
    text: "The sneaker collection is stunning. Fast delivery, perfect fit, and the leather quality is exceptional. This is what Pakistani craftsmanship looks like.",
    rating: 5,
    avatar: "FK",
  },
];

const stats = [
  { value: "15,000+", label: "Happy Customers" },
  { value: "500+", label: "Premium Styles" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "10+", label: "Years of Craft" },
];

const features = [
  { icon: Truck, title: "Free Shipping", desc: "Free delivery on orders over Rs. 28,000 anywhere in Pakistan." },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free return policy. No questions asked." },
  { icon: Shield, title: "Authenticity Guaranteed", desc: "Every pair is genuine, certified, and quality-checked." },
  { icon: Award, title: "Premium Quality", desc: "Handcrafted from the finest leathers and materials." },
];

export default function Home() {
  const { data: featuredProducts, isLoading } = useGetFeaturedProducts();

  return (
    <main id="main-content" className="w-full overflow-hidden">
<Navbar/>
      {/* ── Hero ─────────────────────────────────────────── */}
           <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-muted">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/6910303/pexels-photo-6910303.jpeg" 
            alt="Premium boots" 
            className="w-full h-full object-cover object-center opacity-99"
          />
          <div className="absolute inset-0 " />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl text-[#E2DFD2] md:text-6xl lg:text-7xl font-serif font-bold  mb-6 tracking-tighter">
            Soft Chappal
          </h1>
          <p className="text-lg text-[#E2DFD2] md:text-lg  max-w-2xl mb-10">
            Premium footwear designed for those who appreciate the details. Explore our curated collection of uncompromising quality.
          </p>
          <div className="flex gap-4">
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 text-base font-semibold">
                Shop Collection
              </Button>
            </Link>
            <Link href="/shop?category=new">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold bg-background/50 backdrop-blur-sm">
                New Arrivals
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* ── Featured Products ─────────────────────────────── */}
      <section className="py-28 container mx-auto px-6" aria-label="Featured products">
        <div className="flex justify-between items-end mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Handpicked</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Featured Collection</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-line">
            View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] skeleton" />
                <div className="h-4 skeleton w-3/4" />
                <div className="h-4 skeleton w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featuredProducts?.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link href="/shop">
            <Button variant="outline" className="h-11 px-8 text-sm">View All Products</Button>
          </Link>
        </div>
      </section>

      {/* ── Brand Promise ─────────────────────────────────── */}
      <section className="py-24 bg-muted/40" aria-label="Brand promise">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Why Choose Us</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">The Kashan Promise</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 bg-background border border-border hover:border-foreground hover:shadow-lg transition-all duration-300 hover-3d"
              >
                <div className="mb-5 p-3 w-10 h-10 border border-border flex items-center justify-center group-hover:border-foreground group-hover:bg-foreground transition-all duration-300">
                  <feature.icon className="h-4 w-4 text-foreground group-hover:text-background transition-colors duration-300" aria-hidden="true" />
                </div>
                <h3 className="font-serif font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────── */}
      <section className="py-28" aria-label="Shop by category">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Browse</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: "/shop?category=boots", img: "/images/boots.png", label: "Boots", desc: "Bold & Durable" },
              { href: "/shop?category=sneakers", img: "/images/sneakers.png", label: "Sneakers", desc: "Casual & Comfortable" },
              { href: "/shop?category=loafers", img: "/images/loafers.png", label: "Loafers", desc: "Smart & Refined" },
            ].map((cat) => (
              <Link key={cat.label} href={cat.href}
                className="group relative overflow-hidden flex items-end p-8 img-zoom"
                style={{ height: "440px" }}
                aria-label={`Shop ${cat.label}`}
              >
                <img src={cat.img} alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />
                <div className="relative z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
                  <p className="text-white/60 text-xs uppercase tracking-[0.15em] mb-1">{cat.desc}</p>
                  <h3 className="text-3xl font-serif font-bold text-white mb-4">{cat.label}</h3>
                  <span className="inline-flex items-center text-white/70 text-sm font-medium group-hover:text-white transition-colors gap-2">
                    Explore <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="py-28 bg-foreground text-background" aria-label="Customer reviews">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.18em] text-background/40 mb-3">Reviews</p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <article key={t.name}
                className="bg-white/5 p-8 border border-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex gap-1 mb-5" aria-label={`${t.rating} stars`}>
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-background/70 leading-relaxed mb-6 text-[15px] italic font-serif">
                  "{t.text}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-background/45 text-xs mt-0.5">{t.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────── */}
      <section className="py-28 container mx-auto px-6" aria-label="Newsletter signup">
        <div className="bg-muted/50 p-12 md:p-20 text-center border border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-foreground/20" aria-hidden="true" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Stay Updated</p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Join the Inner Circle</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Early access to new arrivals, exclusive discounts, and insider style tips delivered to your inbox.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Newsletter signup form"
          >
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              className="flex-1 h-12 px-4 border border-border bg-background text-sm focus:outline-none focus:border-foreground transition-colors"
              autoComplete="email"
            />
            <Button type="submit" className="h-12 px-8 text-sm font-semibold shrink-0">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <section className="py-28 bg-black text-white text-center" aria-label="Call to action">
        <div className="container mx-auto px-6">
          <p className="text-white/40 text-xs uppercase tracking-[0.18em] mb-5">Ready?</p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
            Step Into Your<br />Best Self.
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Explore our full collection. Premium footwear for every occasion, delivered across Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop">
              <Button size="lg" className="h-13 px-12 text-sm font-semibold bg-white text-black hover:bg-white/92">
                Shop Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-13 px-12 text-sm font-medium border-white/20 text-white hover:bg-white/8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer/>
      <WhatsAppButton />
    </main>
  );
}
