
// 📁 src/app/layout.tsx
import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/ui/providers";
import FacebookPixel from "@/components/ui/Facebookpixel";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.softchappal.com";

const VIDEO_URL =
  "https://zilbil.store/cdn/shop/videos/c/vp/fc8d9daff78c446da8c18afa24aa22d0/fc8d9daff78c446da8c18afa24aa22d0.HD-1080p-7.2Mbps-39494283.mp4?v=0";
const POSTER_URL =
  "https://images.pexels.com/photos/6910303/pexels-photo-6910303.jpeg";

export const metadata: Metadata = {
  // ✅ Basic
  title: {
    default: "Shoe World | Premium Pakistani Footwear",
    template: "%s | Shoe World",
  },
  description:
    "Handcrafted premium chappals made in Pakistan. Comfortable, durable, and stylish footwear for men and women. Shop online with fast delivery across Pakistan.",
  metadataBase: new URL(BASE_URL),

  // ✅ Keywords
  keywords: [
    "chappal", "Shoe World", "Pakistani chappal", "chappals online",
    "men chappal", "women chappal", "handmade chappal", "premium footwear Pakistan",
    "buy chappal online", "chappal Pakistan delivery",
  ],

  // ✅ Authors & Publisher
  authors: [{ name: "Shoe World", url: BASE_URL }],
  creator: "Shoe World",
  publisher: "Shoe World",

  // ✅ Canonical & Alternate
  alternates: {
    canonical: BASE_URL,
    languages: { "en-PK": BASE_URL },
  },

  // ✅ Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: BASE_URL,
    siteName: "Shoe World",
    title: "Shoe World | Premium Pakistani Footwear",
    description:
      "Handcrafted premium chappals made in Pakistan. Comfortable, durable & stylish. Shop now with fast delivery.",
    images: [
      {
        url: POSTER_URL,
        width: 1200,
        height: 630,
        alt: "Shoe World — Premium Pakistani Footwear",
      },
    ],
  },

  // ✅ Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "Shoe World | Premium Pakistani Footwear",
    description:
      "Handcrafted premium chappals made in Pakistan. Shop online with fast delivery.",
    images: [POSTER_URL],
    creator: "@softchappal", // apna Twitter handle yahan
  },

  // ✅ Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ✅ Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // ✅ Manifest (PWA)
  manifest: "/site.webmanifest",

  // ✅ Verification (Google Search Console mein milega)
  verification: {
    google: "8e9e4a1d3172b8f7", // 👈 replace karein
  },

  // ✅ Category
  category: "ecommerce",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${orbitron.variable}`}>
      <head>
        <link rel="preload" as="image" href={POSTER_URL} fetchPriority="high" />
        <link rel="preload" as="video" href={VIDEO_URL} type="video/mp4" />

        {/* ✅ JSON-LD Structured Data — Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Shoe World",
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              image: POSTER_URL,
              description:
                "Handcrafted premium chappals made in Pakistan. Comfortable, durable & stylish footwear.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "PK",
                addressRegion: "Punjab",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["English", "Urdu"],
              },
              sameAs: [
                "https://www.facebook.com/softchappal",   // 👈 apna link
                "https://www.instagram.com/softchappal",  // 👈 apna link
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <FacebookPixel />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}