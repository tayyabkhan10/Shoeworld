

"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useGetFeaturedProducts } from "@/hooks/api";
// import WhatsAppButton from "@/components/ui/WhatsAppButton"
import { ProductCard } from "@/components/shared/ProductCard";
import { ArrowRight } from "lucide-react";
import HeroVideo from "@/components/ui/HeroVideo";


const Spotlight = dynamic(() => import("@/components/ui/Spotlight"), { ssr: true });
const BrandPromise = dynamic(() => import("@/components/ui/Brandpromise"), { ssr: true });
const Categories = dynamic(() => import("@/components/ui/Categories"), { ssr: true });
const LifestyleSection = dynamic(() => import("@/components/ui/LifestyleSection"), { ssr: true });
const Newsletter = dynamic(() => import("@/components/ui/Newsletter"), { ssr: true });
const BottomCTA = dynamic(() => import("@/components/ui/BottomCTA"), { ssr: true });

export default function Home() {

  const { data: featuredProducts, isLoading } = useGetFeaturedProducts();

  return (
    <main id="main-content" className="w-full overflow-hidden">
      <Navbar />

      <HeroVideo
        videoSrc="https://zilbil.store/cdn/shop/videos/c/vp/fc8d9daff78c446da8c18afa24aa22d0/fc8d9daff78c446da8c18afa24aa22d0.HD-1080p-7.2Mbps-39494283.mp4?v=0"
        posterSrc="https://images.pexels.com/photos/6910303/pexels-photo-6910303.jpeg"
        title="Soft Chappal"
      />

    
      <section className="py-16 sm:py-28 container mx-auto px-4 sm:px-6" aria-label="Featured products">
        <div className="flex justify-between items-end mb-8 sm:mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Handpicked</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">S-Trend</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-line">
            View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] skeleton" />
                <div className="h-4 skeleton w-3/4" />
                <div className="h-4 skeleton w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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

      <Spotlight />
      <BrandPromise />
      <Categories />
      <LifestyleSection />
      <Newsletter />
      <BottomCTA />

      <Footer />
      {/* <WhatsAppButton /> */}
    </main>
  );
}


// // src/app/page.js
// export default function Home() {
//   return (
//     <main className="text-center" style={{ display: "grid", placeItems: "center", height: "100vh" }}>
//       <h1>Applicatio Error : Your free tier hosting plan will be ending. Upgrade your plan to continue. </h1>
//     </main>
//   );
// }