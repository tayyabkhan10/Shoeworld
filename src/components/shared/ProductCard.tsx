'use client';
import Link from "next/link"; 
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/hooks/api";
import { formatPKR } from "@/lib/pkr";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-none shadow-none bg-transparent hover-elevate">
        <div className="aspect-[4/5] relative overflow-hidden bg-muted rounded-md mb-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          {!product.inStock && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 uppercase font-bold tracking-wider">
              Sold Out
            </div>
          )}
          {product.featured && product.inStock && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 uppercase font-bold tracking-wider">
              Featured
            </div>
          )}
        </div>
        <CardContent className="p-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-xs md:text-md lg:text-lg line-clamp-1">{product.name}</h3>
            <span className="font-medium text-xs md:text-md lg:text-lg">{formatPKR(product.price)}</span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
        </CardContent>
      </Card>
    </Link>
  );
}