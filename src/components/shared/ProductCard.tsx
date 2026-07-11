

'use client';
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/hooks/api";
import { formatPKR } from "@/lib/pkr";

export function ProductCard({ product }: { product: Product }) {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const thumbnails = (product.additionalImages || []).slice(0, 4);

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-none shadow-none bg-transparent transition-all duration-500 ease-out hover:-translate-y-1.5">
        <div className="aspect-[4/5] relative overflow-hidden bg-muted rounded-md mb-3 shadow-sm transition-shadow duration-500 ease-out group-hover:shadow-xl">
          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-foreground text-background text-xs px-2 py-1 uppercase font-bold tracking-wider">
              {discountPercent}% Off
            </div>
          )}
          {!product.inStock && (
            <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs px-2 py-1 uppercase font-bold tracking-wider">
              Sold Out
            </div>
          )}
          {product.featured && product.inStock && discountPercent === 0 && (
            <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 uppercase font-bold tracking-wider">
              Featured
            </div>
          )}

          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            loading="lazy"
          />

          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none" />

          <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white font-medium">
              View Product
            </span>
          </div>
        </div>

        {thumbnails.length > 0 && (
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
            {thumbnails.map((img, idx) => (
              <div
                key={idx}
                className="relative w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-border"
              >
                <Image src={img} alt="" fill className="object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <CardContent className="p-0 text-center">
          <h3 className="font-semibold text-xs md:text-md lg:text-lg line-clamp-1 mb-1 transition-colors duration-300 group-hover:text-foreground/70">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-center gap-2 mb-1">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                {formatPKR(product.originalPrice)}
              </span>
            )}
            <span className="font-medium text-xs md:text-md lg:text-lg">
              {formatPKR(product.price)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}