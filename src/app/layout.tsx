// 📁 src/app/layout.tsx
import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/ui/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Adnan Shoes | Premium Pakistani Footwear", template: "%s | Adnan Shoes" },
  description: "Handcrafted premium footwear designed for those who appreciate the details.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {/* ✅ Sab kuch Providers ke andar wrap karein */}
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}