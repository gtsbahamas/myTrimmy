/**
 * Root Layout - Iconym
 *
 * The last mile for your brand.
 * Transform any logo into production-ready assets for iOS, Android, Web, and Social.
 */

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iconym — The Last Mile for Your Brand",
  description: "Transform any logo into production-ready assets. Generate iOS icons, Android adaptive icons, favicons, PWA assets, and social media images in one click.",
  keywords: ["app icons", "favicon generator", "iOS icons", "Android icons", "PWA assets", "og:image generator", "brand assets", "icon generator"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Iconym — The Last Mile for Your Brand",
    description: "One logo in, 50+ production-ready assets out. iOS, Android, Web, Social. Ship faster.",
    type: "website",
    siteName: "Iconym",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Iconym - The Last Mile for Your Brand",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Iconym — The Last Mile for Your Brand",
    description: "One logo in, 50+ production-ready assets out. iOS, Android, Web, Social. Ship faster.",
    creator: "@iconym",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://iconym.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased custom-scrollbar">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
