import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sara Ahmed",
    role: "Fashion Blogger, Lahore",
    text: "Soft-Chappal has completely redefined premium footwear in Pakistan. The quality is unmatched — every pair I've bought has lasted for years.",
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

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-28 bg-foreground text-background" aria-label="Customer reviews">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] uppercase tracking-[0.18em] text-background/40 mb-3">Reviews</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">What Our Customers Say</h2>
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
              <blockquote className="text-background/70 leading-relaxed mb-6 text-[15px] italic">
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
  );
}