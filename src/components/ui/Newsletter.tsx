"use client"
import { Button } from "@/components/ui/button";

export default function Newsletter() {
  return (
    <section className="py-16 sm:py-28 container mx-auto px-4 sm:px-6" aria-label="Newsletter signup">
      <div className="bg-muted/50 p-8 sm:p-12 md:p-20 text-center border border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-foreground/20" aria-hidden="true" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Stay Updated</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Join the Inner Circle</h2>
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
  );
}