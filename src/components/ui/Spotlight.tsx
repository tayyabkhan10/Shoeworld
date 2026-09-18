"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-orbitron",
});

// ── DUMMY DATA - SANDALS/CHAPPALS/SLIPPERS ──────────────────────
// IMPORTANT: images public/images/ folder ke andar honi chahiye.
// e.g. public/images/aa.jpeg  ->  src: "/images/aa.jpeg"
const SPOTLIGHT_DATA = [
  {
    _id: "1",
    name: "Olive Leather Sandals",
    slug: "olive-leather-sandals",
    image: {
      src: "/images/aa.jpeg",
      alt: "Olive Leather Sandals",
    },
  },
  {
    _id: "2",
    name: "Buckle Leather Slides",
    slug: "buckle-leather-slides",
    image: {
      src: "/images/bb.jpeg",
      alt: "Buckle Leather Slides",
    },
  },
  {
    _id: "3",
    name: "Bow Strap Slides",
    slug: "bow-strap-slides",
    image: {
      src: "/images/mm.jpg",
      alt: "Bow Strap Slides",
    },
  },
  {
    _id: "4",
    name: "Zebra Print Flip Flops",
    slug: "zebra-print-flip-flops",
    image: {
      src: "/images/cc.jpeg",
      alt: "Zebra Print Flip Flops",
    },
  },
  {
    _id: "5",
    name: "Sport Flip Flops",
    slug: "sport-flip-flops",
    image: {
      src: "/images/dd.jpeg",
      alt: "Sport Flip Flops",
    },
  },
  {
    _id: "6",
    name: "Casual Flip Flops",
    slug: "casual-flip-flops",
    image: {
      src: "/images/ee.jpeg",
      alt: "Casual Flip Flops",
    },
  },
  {
    _id: "7",
    name: "Beach Flip Flops",
    slug: "beach-flip-flops",
    image: {
      src: "/images/ff.jpeg",
      alt: "Beach Flip Flops",
    },
  },
  {
    _id: "8",
    name: "Classic Beach Chappals",
    slug: "classic-beach-chappals",
    image: {
      src: "/images/jj.jpeg",
      alt: "Classic Beach Chappals",
    },
  },
  {
    _id: "9",
    name: "Blue Rubber Flip Flops",
    slug: "blue-rubber-flip-flops",
    image: {
      src: "/images/kk.jpeg",
      alt: "Blue Rubber Flip Flops",
    },
  },
  {
    _id: "10",
    name: "Havaianas Style Flip Flops",
    slug: "havaianas-style-flip-flops",
    image: {
      src: "/images/ll.avif",
      alt: "Havaianas Style Flip Flops",
    },
  },
];

// ── SCROLL ANIMATION HOOK ──────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible] as const;
}

// ── SPOTLIGHT ITEM COMPONENT ───────────────────────────────────
function SpotlightCard({
  item,
  priority = false,
}: {
  item: typeof SPOTLIGHT_DATA[0];
  index: number;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/shop`}
      className="group flex-shrink-0 mb-20 w-40 md:w-48 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-105"
    >
      {/* Image Container */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm group-hover:shadow-lg transition-all duration-500">
        <Image
          src={item.image.src}
          alt={item.image.alt || item.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 128px, 160px"
          quality={70}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Name */}
      <span className="text-xs md:text-sm font-semibold text-neutral-800 text-center group-hover:text-black transition-colors duration-300">
        {item.name}
      </span>
    </Link>
  );
}

// ── MAIN SPOTLIGHT SECTION ─────────────────────────────────────
export default function SpotlightSection() {
  const [sectionRef, sectionVisible] = useInView();

  return (
    <section ref={sectionRef} className="pt-20 px-4 bg-white overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16">
        <div
          className={`text-center transition-all duration-1000 ${
            sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2
            className={`${orbitron.className} text-4xl sm:text-5xl md:text-7xl font-black text-neutral-900 mb-4 tracking-tight`}
          >
            SPOTLIGHT
          </h2>
          <p className="text-neutral-600 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Classic silhouettes and cutting-edge innovation to build your game from the ground up.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Scrolling Track — right to left, infinite, never pauses */}
        <div className="flex spotlight-marquee-track">
          {/* Set 1 — only first set gets priority, it's the one visible on load */}
          <div className="flex gap-4 md:gap-8 pr-4 md:pr-8 flex-shrink-0">
            {SPOTLIGHT_DATA.map((item, index) => (
              <SpotlightCard
                key={`set1-${item._id}-${index}`}
                item={item}
                index={index}
                priority={index < 4}
              />
            ))}
          </div>
          {/* Set 2 - Duplicate */}
          <div className="flex gap-4 md:gap-8 pr-4 md:pr-8 flex-shrink-0">
            {SPOTLIGHT_DATA.map((item, index) => (
              <SpotlightCard
                key={`set2-${item._id}-${index}`}
                item={item}
                index={index + SPOTLIGHT_DATA.length}
              />
            ))}
          </div>
          {/* Set 3 - Duplicate */}
          <div className="flex gap-4 md:gap-8 flex-shrink-0">
            {SPOTLIGHT_DATA.map((item, index) => (
              <SpotlightCard
                key={`set3-${item._id}-${index}`}
                item={item}
                index={index + SPOTLIGHT_DATA.length * 2}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Infinite Scroll CSS - moves continuously right to left, no pause on hover */}
      <style>{`
        @keyframes spotlightMarqueeScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.3333%);
          }
        }
        .spotlight-marquee-track {
          width: max-content;
          animation: spotlightMarqueeScroll 12s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}