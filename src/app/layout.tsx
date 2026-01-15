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
  openGraph: {
    title: "Iconym — The Last Mile for Your Brand",
    description: "One logo in, 50+ production-ready assets out. iOS, Android, Web, Social. Ship faster.",
    type: "website",
    siteName: "Iconym",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iconym — The Last Mile for Your Brand",
    description: "One logo in, 50+ production-ready assets out. iOS, Android, Web, Social. Ship faster.",
    creator: "@iconym",
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
