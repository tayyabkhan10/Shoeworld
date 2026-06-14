
'use client';
import { useState, useEffect, Suspense } from "react"; // 👈 Suspense import karein
import { useSearchParams } from "next/navigation";
import { useListProducts, useGetCategories } from "@/hooks/api";
import { ProductCard } from "@/components/shared/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/badge";
import  WhatsAppButton  from "@/components/WhatsAppButton"
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

const SIZES = ["6", "7", "8", "9", "10", "11", "12"];
const COLORS = ["Black", "Brown", "White", "Tan", "Navy", "Grey"];

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [sizeExpanded, setSizeExpanded] = useState(true);
  const [colorExpanded, setColorExpanded] = useState(true);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const { data: products, isLoading } = useListProducts({
    search: search || undefined,
    category: category || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  const { data: categories } = useGetCategories();

  const filteredProducts = products?.filter((p) => {
    if (selectedSizes.length > 0 && !selectedSizes.some((s) => p.sizes?.includes(s))) return false;
    if (selectedColors.length > 0 && !selectedColors.some((c) => p.colors?.includes(c))) return false;
    return true;
  }) ?? [];

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleColor = (c: string) =>
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const activeFilterCount =
    (category ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const Filters = () => (
    <div className="space-y-6">
    
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Categories</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setCategory("")}
            className={`text-sm block w-full text-left px-2 py-1.5 rounded transition-colors ${
              category === "" ? "font-semibold text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {categories?.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`text-sm block w-full text-left px-2 py-1.5 rounded transition-colors capitalize flex justify-between ${
                category === c.name ? "font-semibold text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-muted"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t pt-6">
        <button
          className="flex justify-between items-center w-full mb-3"
          onClick={() => setPriceExpanded(!priceExpanded)}
        >
          <h3 className="font-semibold text-sm uppercase tracking-wider">Price Range</h3>
          {priceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {priceExpanded && (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-8 text-sm rounded-none"
            />
            <span className="text-muted-foreground text-sm shrink-0">–</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-8 text-sm rounded-none"
            />
          </div>
        )}
      </div>

      {/* Sizes */}
      <div className="border-t pt-6">
        <button
          className="flex justify-between items-center w-full mb-3"
          onClick={() => setSizeExpanded(!sizeExpanded)}
        >
          <h3 className="font-semibold text-sm uppercase tracking-wider">Size</h3>
          {sizeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {sizeExpanded && (
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`h-9 w-9 text-sm border transition-colors ${
                  selectedSizes.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="border-t pt-6">
        <button
          className="flex justify-between items-center w-full mb-3"
          onClick={() => setColorExpanded(!colorExpanded)}
        >
          <h3 className="font-semibold text-sm uppercase tracking-wider">Color</h3>
          {colorExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {colorExpanded && (
          <div className="space-y-2">
            {COLORS.map((c) => (
              <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleColor(c)}
                  className={`h-4 w-4 border flex items-center justify-center transition-colors cursor-pointer ${
                    selectedColors.includes(c)
                      ? "bg-primary border-primary"
                      : "border-border group-hover:border-primary"
                  }`}
                >
                  {selectedColors.includes(c) && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => toggleColor(c)}
                  className="text-sm text-muted-foreground group-hover:text-primary transition-colors cursor-pointer capitalize"
                >
                  {c}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="border-t pt-4">
          <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={clearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <WhatsAppButton />
      <Navbar />
    <div className="container mx-auto px-4 py-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">Collection</h1>
          <p className="text-muted-foreground">Discover our carefully curated footwear.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9 bg-background rounded-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={mobileFilterOpen ? "default" : "outline"}
            size="icon"
            className="shrink-0 md:hidden rounded-none relative"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category && (
            <Badge variant="secondary" className="gap-1 rounded-none capitalize">
              {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory("")} />
            </Badge>
          )}
          {selectedSizes.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 rounded-none">
              Size {s}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSize(s)} />
            </Badge>
          ))}
          {selectedColors.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1 rounded-none">
              {c}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleColor(c)} />
            </Badge>
          ))}
          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1 rounded-none">
              ${minPrice || "0"} – ${maxPrice || "∞"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
            </Badge>
          )}
        </div>
      )}

      {/* Mobile filter panel */}
      {mobileFilterOpen && (
        <div className="md:hidden bg-muted/30 border border-border p-6 mb-6 rounded-none">
          <Filters />
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-56 shrink-0">
          <Filters />
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-muted animate-pulse rounded-md" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 bg-muted/50 rounded-none border border-dashed">
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
              <Button onClick={clearAll} className="rounded-none">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    <Footer />
    
    </div>
  );
}

// ==========================================
// 2. MAIN PAGE EXPORT (Suspense Wrapper)
// ==========================================
export default function Shop() {
  return (
    // 👇 ShopContent ko Suspense mein wrap karein
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading products...</p>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}