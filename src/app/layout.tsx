/**
 * Root Layout - myTrimmy
 *
 * Digital Darkroom aesthetic with Playfair Display (serif headlines)
 * and DM Sans (refined body text).
 */

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "myTrimmy — Professional Image Processing",
  description: "Transform your images with precision. Professional-grade batch processing, format conversion, and optimization.",
  openGraph: {
    title: "myTrimmy — Professional Image Processing",
    description: "Transform your images with precision. Professional-grade batch processing, format conversion, and optimization.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "myTrimmy — Professional Image Processing",
    description: "Transform your images with precision. Professional-grade batch processing, format conversion, and optimization.",
  },
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
