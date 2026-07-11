// 'use client';
// import { useState } from "react";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { useQueryClient } from "@tanstack/react-query";
// import { useGetProduct, useAddToCart, getGetCartQueryKey } from "@/hooks/api";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { formatPKR } from "@/lib/pkr";


// export default function ProductDetail() {
//   const { id } = useParams();
//   const productId = Number(id);
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   const { data: product, isLoading, error } = useGetProduct(productId);

//   const { mutate: addToCart, isPending: isAdding } = useAddToCart({
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
//       toast({
//         title: "Added to cart",
//         description: `${product?.name} has been added to your cart.`,
//         duration : 2000,
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Failed to add to cart",
//         description: "Please Login First.",
//         variant: "destructive",
//       });

//       setTimeout(() => {
//         router.push("/auth/login");
//       }, 500);
//     }
//   });

//   const [selectedSize, setSelectedSize] = useState<string>("");
//   const [selectedColor, setSelectedColor] = useState<string>("");
//   const [quantity, setQuantity] = useState<number>(1);
//   const [activeImage, setActiveImage] = useState<string>("");

//   if (isLoading) {
//     return (
//       <div className="container mx-auto px-4 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
//           <div className="aspect-[4/5] bg-muted animate-pulse rounded-md" />
//           <div className="space-y-6">
//             <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
//             <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
//             <div className="h-24 bg-muted animate-pulse rounded w-full" />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="container mx-auto px-4 py-24 text-center">
//         <h2 className="text-2xl font-semibold mb-4">Product not found</h2>
//         <Link href="/shop">
//           <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</Button>
//         </Link>
//       </div>
//     );
//   }

//   const allImages = [product.imageUrl, ...(product.additionalImages || [])];
//   const currentImage = activeImage || product.imageUrl;

//   const handleAddToCart = () => {
//     if (!selectedSize || !selectedColor) {
//       toast({
//         title: "Please select options",
//         description: "You must select a size and color before adding to cart.",
//         variant: "destructive"
//       });
//       return;
//     }

//     addToCart({
//       productId: product.id,
//       quantity,
//       size: selectedSize,
//       color: selectedColor,
//     });
//   };

//   return (
//     <div className="container mx-auto px-4 py-12">
//       <div className="mb-6 flex justify-between">
//         <Link href="/shop" className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors">
//           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
//         </Link>
//         <Link href="/cart" className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors">
//           Go to Cart <ArrowRight className="mr-2 ml-2 h-4 w-4" />
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
//         {/* Images */}
//         <div className="space-y-4">
//           <div className="aspect-[4/5] bg-muted rounded-md overflow-hidden bg-background">
//             <img
//               src={currentImage}
//               alt={product.name}
//               className="w-full h-full object-cover"
//             />
//           </div>
//           {allImages.length > 1 && (
//             <div className="flex gap-4 overflow-x-auto pb-2">
//               {allImages.map((img, idx) => (
//                 <button
//                   key={idx}
//                   onClick={() => setActiveImage(img)}
//                   className={`w-20 h-24 shrink-0 rounded-md overflow-hidden border-2 ${currentImage === img ? 'border-primary' : 'border-transparent'}`}
//                 >
//                   <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Details */}
//         <div className="flex flex-col">
//           <div className="mb-8">
//             <h1 className="text-4xl font-serif font-bold mb-4">{product.name}</h1>
//             <div className="flex items-center gap-4 mb-4">
//               <span className="text-2xl font-bold">{formatPKR(product.price)}</span>
//               {product.originalPrice && (
//                 <span className="text-lg text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
//               )}
//             </div>
//             {product.description && (
//               <p className="text-muted-foreground leading-relaxed">{product.description}</p>
//             )}
//           </div>

//           <div className="space-y-8 flex-1">
//             {/* Colors */}
//             {product.colors && product.colors.length > 0 && (
//               <div>
//                 <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Color: {selectedColor}</h3>
//                 <div className="flex flex-wrap gap-3">
//                   {product.colors.map(color => (
//                     <button
//                       key={color}
//                       onClick={() => setSelectedColor(color)}
//                       className={`h-10 px-4 rounded-md border text-sm font-medium transition-colors ${selectedColor === color
//                           ? 'border-primary bg-primary text-primary-foreground'
//                           : 'border-input hover:border-primary hover:bg-muted'
//                         }`}
//                     >
//                       {color}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Sizes */}
//             {product.sizes && product.sizes.length > 0 && (
//               <div>
//                 <div className="flex justify-between items-center mb-3">
//                   <h3 className="text-sm font-semibold uppercase tracking-wider">Size: {selectedSize}</h3>
//                 </div>
//                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
//                   {product.sizes.map(size => (
//                     <button
//                       key={size}
//                       onClick={() => setSelectedSize(size)}
//                       className={`h-12 rounded-md border flex items-center justify-center text-sm font-medium transition-colors ${selectedSize === size
//                           ? 'border-primary bg-primary text-primary-foreground'
//                           : 'border-input hover:border-primary hover:bg-muted'
//                         }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Quantity */}
//             <div>
//               <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Quantity</h3>
//               <div className="flex items-center border rounded-md w-32">
//                 <button
//                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                   className="h-12 w-10 flex items-center justify-center hover:bg-muted transition-colors"
//                 >
//                   <Minus className="h-4 w-4" />
//                 </button>
//                 <div className="h-12 flex-1 flex items-center justify-center font-medium border-x">
//                   {quantity}
//                 </div>
//                 <button
//                   onClick={() => setQuantity(quantity + 1)}
//                   className="h-12 w-10 flex items-center justify-center hover:bg-muted transition-colors"
//                 >
//                   <Plus className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>

//             {/* Add to Cart */}
//             <div className="pt-6 border-t">
//               {product.inStock ? (
//                 <Button
//                   size="lg"
//                   className="w-full h-14 text-base font-semibold rounded-none"
//                   onClick={handleAddToCart}
//                   disabled={isAdding}
//                 >
//                   {isAdding ? (
//                     <span className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 animate-pulse" /> Adding...</span>
//                   ) : (
//                     <span className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart</span>
//                   )}
//                 </Button>
//               ) : (
//                 <Button size="lg" className="w-full h-14 text-base font-semibold rounded-none" disabled variant="secondary">
//                   Out of Stock
//                 </Button>
//               )}
//             </div>

//             <div className="grid grid-cols-2 gap-4 pt-6 text-sm text-muted-foreground border-t">
//               <div className="flex items-center gap-2">
//                 <Check className="h-4 w-4 text-green-500" /> Free shipping on orders over Rs. 28,000
//               </div>
//               <div className="flex items-center gap-2">
//                 <Check className="h-4 w-4 text-green-500" /> 30-day returns
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProduct, useAddToCart, getGetCartQueryKey } from "@/hooks/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPKR } from "@/lib/pkr";


export default function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: product, isLoading, error } = useGetProduct(productId);

  const { mutate: addToCart, isPending: isAdding } = useAddToCart({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart.`,
        duration : 2000,
      });
    },
    onError: () => {
      toast({
        title: "Failed to add to cart",
        description: "Please Login First.",
        variant: "destructive",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 500);
    }
  });

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>("");

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[4/5] bg-muted animate-pulse rounded-md" />
          <div className="space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-24 bg-muted animate-pulse rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-semibold mb-4">Product not found</h2>
        <Link href="/shop">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.additionalImages || [])];
  const currentImage = activeImage || product.imageUrl;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: "Please select options",
        description: "You must select a size and color before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    addToCart({
      productId: product.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6 flex justify-between">
        <Link href="/shop" className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Collection
        </Link>
        <Link href="/cart" className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors">
          Go to Cart <ArrowRight className="mr-2 ml-2 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-muted rounded-md overflow-hidden bg-background relative">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
              quality={80}
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-24 shrink-0 rounded-md overflow-hidden border-2 ${currentImage === img ? 'border-primary' : 'border-transparent'}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    quality={50}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-bold">{formatPKR(product.price)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPKR(product.originalPrice)}</span>
              )}
            </div>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="space-y-8 flex-1">
            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Color: {selectedColor}</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 px-4 rounded-md border text-sm font-medium transition-colors ${selectedColor === color
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary hover:bg-muted'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Size: {selectedSize}</h3>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 rounded-md border flex items-center justify-center text-sm font-medium transition-colors ${selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary hover:bg-muted'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-12 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="h-12 flex-1 flex items-center justify-center font-medium border-x">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-12 w-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="pt-6 border-t">
              {product.inStock ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold rounded-none"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <span className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 animate-pulse" /> Adding...</span>
                  ) : (
                    <span className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart</span>
                  )}
                </Button>
              ) : (
                <Button size="lg" className="w-full h-14 text-base font-semibold rounded-none" disabled variant="secondary">
                  Out of Stock
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 text-sm text-muted-foreground border-t">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Free shipping on orders over Rs. 28,000
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> 30-day returns
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}