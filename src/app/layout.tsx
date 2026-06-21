
// // 📁 src/app/layout.tsx
// import type { Metadata } from "next";
// import { Orbitron } from "next/font/google";

// import { Toaster } from "@/components/ui/toaster";
// import { Providers } from "@/components/ui/providers";
// import "./globals.css";

// // Configure Orbitron font
// const orbitron = Orbitron({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-orbitron",
// });

// export const metadata: Metadata = {
//   title: { default: "Adnan Shoes | Premium Pakistani Footwear", template: "%s | Adnan Shoes" },
//   description: "Handcrafted premium footwear designed for those who appreciate the details.",
//   metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" className={`h-full antialiased ${orbitron.variable}`}>
//       {/* Body par font apply NAHI kiya - sirf variable set hai */}
//       <body className="min-h-full flex flex-col font-sans">
//         <Providers>
//           {children}
//           <Toaster />
//         </Providers>
//       </body>
//     </html>
//   );
// }




// 📁 src/app/layout.tsx
import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/ui/providers";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: { default: "Adnan Shoes | Premium Pakistani Footwear", template: "%s | Adnan Shoes" },
  description: "Handcrafted premium footwear designed for those who appreciate the details.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
};

const VIDEO_URL =
  "https://zilbil.store/cdn/shop/videos/c/vp/fc8d9daff78c446da8c18afa24aa22d0/fc8d9daff78c446da8c18afa24aa22d0.HD-1080p-7.2Mbps-39494283.mp4?v=0";
const POSTER_URL =
  "https://images.pexels.com/photos/6910303/pexels-photo-6910303.jpeg";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${orbitron.variable}`}>
      <head>
        {/* ✅ Poster image — fauran visible hogi, blank screen nahi */}
        <link rel="preload" as="image" href={POSTER_URL} fetchPriority="high" />
        {/* ✅ Video — page load hote hi download shuru */}
        <link rel="preload" as="video" href={VIDEO_URL} type="video/mp4" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}