"use client"
import { useEffect, useRef } from "react"
import Link from "next/link"
import { Orbitron } from "next/font/google"

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
})

interface HeroVideoProps {
  videoSrc: string
  posterSrc: string
  title: string
}

export default function HeroVideo({ videoSrc, posterSrc, title }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // Force play as soon as enough data is available
    const tryPlay = () => {
      video.play().catch(() => { })
    }
    if (video.readyState >= 3) {
      tryPlay()
    } else {
      video.addEventListener("canplay", tryPlay, { once: true })
    }
    return () => video.removeEventListener("canplay", tryPlay)
  }, [])

  return (
    <section
      className="relative h-[100vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-muted"
      aria-label="Hero section"
    >
      {/* Preload hints injected into <head> via next/head or metadata — see layout.tsx note below */}

      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover object-center motion-reduce:hidden"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          // fetchpriority tells browser this is the most important resource
          // @ts-ignore — valid HTML attribute, TS types lag behind
          fetchpriority="high"
          aria-hidden="true"
        />
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          className="hidden motion-reduce:block w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container relative z-10 mx-auto bottom-[-70px] lg:bottom-[-30px] px-4 flex flex-col items-center text-center">
        <h1
          className={`${orbitron.className} relative  text-2xl bottom-[-30px] lg:bottom-[-20px] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#E2DFD2] mb-6`}
          style={{ letterSpacing: "3px" }}>
          {title}
        </h1>
        <Link
          href="/shop"
          className="group inline-flex flex-col items-center gap-2 text-[#E2DFD2] transition-opacity hover:opacity-80"
        >
          <span
            className="text-xs mt-5 lg:mt-10 sm:text-sm font-semibold uppercase"
            style={{ letterSpacing: "2px" }}
          >
            Explore Now
          </span>
          <span className="h-px w-10 bg-[#E2DFD2] transition-all duration-300 group-hover:w-14" />
        </Link>
      </div>
    </section>
  )
}

