import Link from "next/link"
import { Button } from "@/components/ui/button";

export default function BottomCTA() {
  return (
    <section className="py-16 sm:py-28 bg-black text-white text-center" aria-label="Call to action">
      <div className="container mx-auto px-4 sm:px-6">
        <p className="text-white/40 text-xs uppercase tracking-[0.18em] mb-5">Ready?</p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
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
  );
}