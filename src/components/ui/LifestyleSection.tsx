

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";

const cards = [
  {
    src: "/images/nn.jpeg",
    tag: "Street Style",
    num: "01",
    title: "Walk with purpose.",
    sub: "Handcrafted leather chappals for the modern stride.",
    category: "Men's Collection",
  },
  {
    src: "/images/oo.jpeg",
    tag: "Everyday",
    num: "02",
    title: "Comfort meets craft.",
    sub: "Premium sandals designed for all-day wear.",
    category: "Women's Edit",
  },
  {
    src: "/images/pp.jpeg",
    tag: "Artisan",
    num: "03",
    title: "Made by hand, worn with pride.",
    sub: "Traditional techniques, contemporary design.",
    category: "Heritage Series",
  },
  {
    src: "/images/qq.jpeg",
    tag: "Lifestyle",
    num: "04",
    title: "From dawn to dusk.",
    sub: "Versatile footwear for every moment.",
    category: "Daily Essentials",
  },
  {
    src: "/images/rr.jpeg",
    tag: "Premium",
    num: "05",
    title: "Elevate your step.",
    sub: "Luxury chappals that define sophistication.",
    category: "Signature Line",
  },
  {
    src: "/images/ss.jpeg",
    tag: "Craft",
    num: "06",
    title: "Details that matter.",
    sub: "Every stitch tells a story of excellence.",
    category: "Artisan Craft",
  },
  {
    src: "/images/tt.jpeg",
    tag: "Modern",
    num: "07",
    title: "Redefining tradition.",
    sub: "Where heritage meets modern aesthetics.",
    category: "Contemporary",
  },
  {
    src: "/images/uu.jpeg",
    tag: "Essential",
    num: "08",
    title: "Your daily companion.",
    sub: "Built for comfort, designed for style.",
    category: "Core Collection",
  },
];

function LifestyleCard({
  card,
  index,
  priority,
}: {
  card: (typeof cards)[0];
  index: number;
  priority: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  });

  const glowX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x}% ${y}%, rgba(255,255,255,0.06), transparent 60%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className="group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] h-[380px] sm:h-[440px] md:h-[480px] lg:h-[540px] cursor-pointer overflow-hidden rounded-sm"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <div className="absolute inset-0 overflow-hidden bg-neutral-100">
        <motion.div
          className="relative w-full h-full"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={card.src}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 360px, 400px"
            className="object-cover transition-[filter] duration-700"
            style={{
              filter: isHovered
                ? "grayscale(0%) brightness(1)"
                : "grayscale(20%) brightness(0.95)",
            }}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={75}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0"
          animate={{
            background: isHovered
              ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)"
              : "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)",
          }}
          transition={{ duration: 0.6 }}
        />

        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: glowBackground }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-5 md:left-5 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.4 }}
      >
        <span className="inline-block text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/90 bg-black/25 backdrop-blur-xl px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 border border-white/15 rounded-sm">
          {card.tag}
        </span>
      </motion.div>

      <motion.div
        className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 z-10"
        animate={{
          opacity: isHovered ? 0.15 : 0.35,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        
      </motion.div>

      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-6 lg:p-7 z-10">
        <motion.div
          animate={{ y: isHovered ? 0 : 12 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/50 mb-2">
            {card.category}
          </p>
          <h3 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] font-light text-white tracking-tight leading-tight mb-1.5 sm:mb-2">
            {card.title}
          </h3>
          <motion.p
            className="text-[11px] sm:text-[12px] md:text-[13px] text-white/60 leading-relaxed max-w-[240px] sm:max-w-[260px] md:max-w-[280px] lg:max-w-[300px]"
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 12,
            }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            {card.sub}
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-3 sm:mt-4 md:mt-5 flex items-center gap-2 sm:gap-2.5 overflow-hidden"
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 16,
          }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-white/80 border-b border-white/30 pb-0.5">
            Explore
          </span>
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-white/80"
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path d="M1 7h12M8 2l5 5-5 5" />
          </motion.svg>
        </motion.div>
      </div>

      <motion.div
        className="absolute top-0 left-0 h-[2px] bg-white z-20"
        initial={{ width: "0%" }}
        animate={{ width: isHovered ? "100%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}

export default function LifestyleSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const progressBarWidth = useSpring(
    useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
    { stiffness: 100, damping: 30 }
  );

  // NOTE: manual preloading removed — Next.js <Image priority> already
  // handles eager loading for the first visible cards. Manually fetching
  // raw <img> tags here was causing a duplicate, non-optimized download
  // of every image on mount, which was the main cause of slowness.

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollStep = () => {
      if (!el || isPausedRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 320, behavior: "smooth" });
      }
    };

    scrollIntervalRef.current = setInterval(scrollStep, 1000);

    const handleMouseEnter = () => {
      isPausedRef.current = true;
    };

    const handleMouseLeave = () => {
      isPausedRef.current = false;
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const duplicatedCards = [...cards, ...cards, ...cards];

  return (
    <section
      ref={sectionRef}
      className="bg-white py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden"
      aria-label="Lifestyle gallery"
    >
      <div className="px-4 sm:px-6 md:px-10 lg:px-14 mb-10 sm:mb-12 md:mb-14 lg:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="flex justify-between items-end flex-wrap gap-4 sm:gap-6 md:gap-8"
        >
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.26em] text-neutral-400 mb-2 sm:mb-3 md:mb-4">
              The Lifestyle Edit
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-extralight text-neutral-900 leading-[0.92] tracking-[-0.035em]">
              Crafted for life.
              <br />
              <span className="text-neutral-300">Worn with intention.</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="text-4xl sm:text-5xl md:text-6xl font-extralight text-neutral-900 tracking-[-0.03em] leading-none mb-1 sm:mb-1.5">
              Featured Collection
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              Series
            </p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 md:px-10 lg:px-14 mb-6 sm:mb-8 md:mb-10">
        <div className="h-px bg-neutral-100 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-neutral-900"
            style={{ width: progressBarWidth }}
          />
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 px-4 sm:px-6 md:px-10 lg:px-14 overflow-x-auto scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex-shrink-0 w-0 md:w-[2vw]" />
          {duplicatedCards.map((card, i) => (
            <LifestyleCard
              key={i}
              card={card}
              index={i % cards.length}
              // only the very first set (the one actually visible on load)
              // gets eager/priority loading — sets 2 & 3 are off-screen
              // duplicates for the marquee and should always be lazy.
              priority={i < 3}
            />
          ))}
          <div className="flex-shrink-0 w-0 md:w-[2vw]" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-14 mt-12 sm:mt-16 md:mt-20">
        <div className="flex-1 h-px bg-neutral-100" />
        <motion.a
          href="/shop"
          className="flex items-center gap-2 sm:gap-3 mx-4 sm:mx-6 md:mx-8 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-neutral-900 border border-neutral-900 px-5 sm:px-6 md:px-8 py-3 sm:py-4 hover:bg-neutral-900 hover:text-white transition-all duration-400 group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Shop Collection
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="group-hover:translate-x-1 transition-transform duration-300"
          >
            <path d="M1 7h12M8 2l5 5-5 5" />
          </svg>
        </motion.a>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
        div { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}