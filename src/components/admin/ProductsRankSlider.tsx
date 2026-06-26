// 📁 src/components/admin/ProductsRankSlider.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { getCached, setCached } from "@/lib/dashboardCache";
import { formatPKR } from "@/lib/pkr";

interface RankedProduct {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  inStock: boolean;
  stockCount: number;
  unitsSold: number;
  revenue: number;
  rank: number;
}

interface ProductsRankData {
  products: RankedProduct[];
  totalProducts: number;
  totalUnitsSold: number;
}

const CACHE_KEY = "products:rank";

const rankBadgeStyle: Record<number, { bg: string; text: string }> = {
  1: { bg: "linear-gradient(135deg,#FBBF24,#D97706)", text: "#fff" },
  2: { bg: "linear-gradient(135deg,#E5E7EB,#9CA3AF)", text: "#fff" },
  3: { bg: "linear-gradient(135deg,#FCA5A5,#DC2626)", text: "#fff" },
};

export default function ProductsRankSlider() {
  const [data, setData] = useState<ProductsRankData | null>(() => getCached<ProductsRankData>(CACHE_KEY));
  const [loading, setLoading] = useState<boolean>(() => !getCached<ProductsRankData>(CACHE_KEY));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef(false);

  const fetchData = useCallback(async () => {
    const cached = getCached<ProductsRankData>(CACHE_KEY);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/products-rank`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const json: ProductsRankData = await res.json();
      setCached(CACHE_KEY, json);
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (data) return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div
      className="rounded-3xl overflow-hidden bg-white border border-gray-100 transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_40px_rgba(5,150,105,0.09),0_4px_12px_rgba(0,0,0,0.04)]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(5,150,105,0.06), 0 2px 8px rgba(0,0,0,0.03)" }}
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #059669 0%, #34D399 50%, #7C3AED 100%)" }} />

      <div className="px-4 sm:px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-500">Best Sellers</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            {loading ? (
              <div className="h-7 w-28 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                {data?.totalProducts ?? 0} products
              </span>
            )}
            {!loading && data && (
              <span className="text-xs text-gray-400 font-medium">· {data.totalUnitsSold.toLocaleString()} units sold</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Ranked live by units sold, every product</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-5 w-8 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-5 w-8 bg-gradient-to-l from-white to-transparent z-10" />

        <div
          ref={scrollRef}
          className="flex gap-3 px-4 sm:px-6 pb-6 overflow-x-auto scroll-smooth snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading || !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[160px] sm:w-[180px] h-[210px] rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: `${i * 0.06}s` }} />
            ))
          ) : data.products.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 px-2">No products yet</p>
          ) : (
            data.products.map((p) => {
              const badge = rankBadgeStyle[p.rank];
              return (
                <div
                  key={p.id}
                  className="group shrink-0 w-[160px] sm:w-[180px] snap-start rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-[110px] bg-gray-50 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className="absolute top-2 left-2 h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm"
                      style={badge ? { background: badge.bg, color: badge.text } : { background: "rgba(255,255,255,0.92)", color: "#374151" }}
                    >
                      #{p.rank}
                    </span>
                    {p.rank <= 3 && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                        <Flame size={12} className="text-orange-500" />
                      </span>
                    )}
                    {!p.inStock && (
                      <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                        Out of stock
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 truncate">{p.category}</p>
                    <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">{p.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-bold text-emerald-600 tabular-nums">{p.unitsSold} sold</span>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">{formatPKR(p.revenue)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}