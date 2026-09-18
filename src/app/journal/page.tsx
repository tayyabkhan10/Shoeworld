'use client';
import Link from "next/link";
import { ArrowRight, Clock, User } from "lucide-react";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
// import  WhatsAppButton  from "@/components/ui/WhatsAppButton"
const articles = [
  {
    id: 1,
    slug: "",
    category: "Craftsmanship",
    title: "The Art of Leather Craftsmanship in Pakistan",
    excerpt: "Pakistan has a centuries-old tradition of working with leather. From the tanneries of Kasur to the cobblers of Peshawar, we explore how this ancient craft shapes every pair we make.",
    image: "/images/boots.png",
    author: "Kashan",
    readTime: "5 min read",
    date: "May 20, 2025",
  },
  {
    id: 2,
    slug: "",
    category: "Care Guide",
    title: "How to Care for Your Leather Boots",
    excerpt: "A well-maintained pair of leather boots can last a decade. Learn the professional techniques for cleaning, conditioning, and storing your boots to preserve their life and beauty.",
    image: "/images/boots.png",
    author: "Kashan",
    readTime: "4 min read",
    date: "May 14, 2025",
  },
  {
    id: 3,
    slug: "",
    category: "Style Guide",
    title: "The Perfect Formal Shoe: A Complete Guide",
    excerpt: "From Oxfords to Derby shoes, understanding the difference between formal footwear can transform your professional wardrobe. Here's everything you need to know.",
    image: "/images/loafers.png",
    author: "Style Team",
    readTime: "6 min read",
    date: "May 8, 2025",
  },
  {
    id: 4,
    slug: "",
    category: "Style",
    title: "Building Your Essential Shoe Collection",
    excerpt: "Every wardrobe needs a strong foundation. We reveal the five pairs every Pakistani man should own — and how to choose quality over quantity every time.",
    image: "/images/loafers.png",
    author: "Style Team",
    readTime: "5 min read",
    date: "April 30, 2025",
  },
  {
    id: 5,
    slug: "",
    category: "Sneakers",
    title: "Sneakers That Work — From Street to Office",
    excerpt: "The line between casual and formal continues to blur. Discover how to style premium sneakers for the modern Pakistani workplace without compromising on professionalism.",
    image: "/images/sneakers.png",
    author: "Kashan",
    readTime: "3 min read",
    date: "April 22, 2025",
  },
  {
    id: 6,
    slug: "",
    category: "Buying Guide",
    title: "The Science of the Perfect Fit",
    excerpt: "Ill-fitting shoes cause more than just discomfort — they affect your posture, confidence, and long-term foot health. Our guide to finding the right fit, every time.",
    image: "/images/boots.png",
    author: "Style Team",
    readTime: "7 min read",
    date: "April 15, 2025",
  },
];

const categories = ["All", "Craftsmanship", "Care Guide", "Style Guide", "Style", "Sneakers", "Buying Guide"];

const articleContent: Record<string, { title: string; body: string }> = {
  "art-of-leather-craftsmanship": {
    title: "The Art of Leather Craftsmanship in Pakistan",
    body: `Pakistan has long been home to some of the world's finest leather artisans. The tanneries of Kasur produce leather that rivals Italian craftsmanship in quality, while the cobblers of Peshawar carry forward traditions passed down through generations.

At Shoe World, we source our leather directly from certified Pakistani tanneries that use vegetable tanning — a slow, sustainable process that produces leather with superior durability and natural beauty. Unlike chrome-tanned leather, which is processed in days, our vegetable-tanned leather takes weeks to develop its character.

**Why handcrafting matters**

Each pair of Shoe World is touched by human hands at every stage — from the cutting of the upper to the hand-stitching of the welt. This attention to detail means no two pairs are identical. Minor variations in grain, color, and texture are not defects — they're the signature of genuine craft.

**The people behind the shoes**

Behind every pair is a team of artisans, many of whom have been working in leather for 20–30 years. We pay fair wages and invest in ongoing training. When you buy Shoe World, you're directly supporting Pakistani craftspeople and their families.

**Caring for handcrafted leather**

Handcrafted leather deserves proper care. A simple routine of brushing, conditioning with natural wax, and proper storage will keep your shoes looking exceptional for years.`,
  },
  "how-to-care-for-leather-boots": {
    title: "How to Care for Your Leather Boots",
    body: `Leather boots are an investment. With proper care, a quality pair can last 10–15 years and look better with age. Here's the complete routine used by professional cobblers.

**After every wear**

Use a horsehair brush or soft cloth to remove surface dust and dirt. This prevents abrasive particles from scratching the leather. Store boots with cedar shoe trees inserted — they absorb moisture, maintain shape, and impart a pleasant scent.

**Weekly care**

Apply a small amount of leather conditioner using a soft cloth in circular motions. Let it absorb for 10–15 minutes, then buff gently. Conditioning prevents the leather from drying out and cracking.

**Monthly polish**

For a lasting shine, apply a thin layer of cream polish matching your boot's color. Let it dry, then buff with a horsehair brush using quick, short strokes. For a mirror shine, apply a small amount of wax polish over the toe cap.

**Wet boots**

Never dry wet leather near direct heat — a radiator or hairdryer will cause cracking. Instead, stuff the boots with newspaper, let them dry naturally in a ventilated room, then condition once dry.

**Deep cleaning**

Once every 3–4 months, use a saddle soap to clean the leather thoroughly. This removes accumulated wax and grime, allowing the leather to breathe properly.`,
  },
};

function ArticleDetail({ slug }: { slug: string }) {
  const content = articleContent[slug];
  const article = articles.find((a) => a.slug === slug);

  if (!content || !article) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Article not found</h2>
        <Link href="/journal" className="text-sm underline text-muted-foreground hover:text-foreground">← Back to Journal</Link>
      </div>
    );
  }

  const paragraphs = content.body.split("\n\n");

  return (
    <main id="main-content" className="min-h-screen">
  
      {/* Hero */}
      <div className="relative h-[50vh] bg-black">
        <img src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 container mx-auto">
          <p className="text-white/60 text-xs uppercase tracking-[0.15em] mb-3">{article.category}</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white max-w-3xl leading-tight">{content.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-white/50 text-sm">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{article.author}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.readTime}</span>
            <span>{article.date}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <Link href="/journal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          ← Back to Journal
        </Link>
        <div className="prose prose-gray max-w-none">
          {paragraphs.map((para, i) => {
            if (para.startsWith("**") && para.endsWith("**")) {
              return <h3 key={i} className="text-xl font-serif font-semibold mt-8 mb-3">{para.replace(/\*\*/g, "")}</h3>;
            }
            return <p key={i} className="text-muted-foreground leading-[1.85] mb-5 text-[15px]">{para}</p>;
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-foreground text-background text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-background/50 mb-3">Ready to Shop?</p>
          <h3 className="text-2xl font-serif font-bold mb-4">Explore Our Collection</h3>
          <Link href="/shop">
            <button className="h-11 px-8 bg-background text-foreground text-sm font-semibold hover:bg-background/90 transition-colors">
              Shop Now
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Journal() {
  return (
    <main id="main-content" className="min-h-screen">
      {/* <WhatsAppButton /> */}
      <Navbar />
      {/* Header */}
      <section className="py-24 bg-foreground text-background text-center">
        <div className="container mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-background/40 mb-4">The Kashan Journal</p>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">Style. Craft. Story.</h1>
          <p className="text-background/55 max-w-lg mx-auto text-sm leading-relaxed">
            Insights on leather craftsmanship, shoe care, and style from the team behind Pakistan's finest footwear.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <div className="border-b border-border bg-white sticky top-16 z-30">
        <div className="container mx-auto px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max" role="tablist" aria-label="Journal categories">
            {categories.map((cat, i) => (
              <button
                key={cat}
                role="tab"
                aria-selected={i === 0}
                className={`px-5 py-4 text-[12px] font-medium tracking-wide uppercase border-b-2 whitespace-nowrap transition-colors ${i === 0
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles */}
      <section className="py-20 container mx-auto px-6">
        {/* Featured article */}
        <Link href={`/journal/${articles[0].slug}`} className="group block mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border hover:border-foreground transition-colors duration-300">
            <div className="relative h-80 lg:h-auto overflow-hidden img-zoom">
              <img
                src={articles[0].image}
                alt={articles[0].title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-10 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4 font-medium">{articles[0].category}</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 group-hover:underline decoration-1 underline-offset-4 leading-tight">
                {articles[0].title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{articles[0].excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{articles[0].readTime}</span>
                <span>{articles[0].date}</span>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                Read Article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.slice(1).map((article) => (
            <Link key={article.id} href={`/journal/${article.slug}`} className="group block hover-elevate">
              <article className="border border-border group-hover:border-foreground transition-all duration-300 h-full flex flex-col">
                <div className="relative h-52 overflow-hidden img-zoom">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3 font-medium">{article.category}</span>
                  <h3 className="text-xl font-serif font-semibold mb-3 group-hover:underline decoration-1 underline-offset-4 leading-snug flex-1">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{article.readTime}</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-foreground text-background" aria-label="Journal newsletter">
        <div className="container mx-auto px-6 text-center max-w-lg">
          <p className="text-[11px] uppercase tracking-[0.2em] text-background/40 mb-4">Stay Informed</p>
          <h2 className="text-3xl font-serif font-bold mb-4">Get the Journal in Your Inbox</h2>
          <p className="text-background/55 text-sm mb-8">New articles every week — style tips, care guides, and stories from the craft.</p>
          <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="journal-email" className="sr-only">Email address</label>
            <input
              id="journal-email"
              type="email"
              placeholder="Your email"
              autoComplete="email"
              className="flex-1 h-11 px-4 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
            <button type="submit" className="h-11 px-6 bg-background text-foreground text-sm font-semibold hover:bg-background/90 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
      <Footer/>
    </main>
  );
}

// export { ArticleDetail };
