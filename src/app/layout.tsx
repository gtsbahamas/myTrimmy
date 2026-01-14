/**
 * Root Layout - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * Main application layout with metadata and global styles.
 * Wraps entire application with Providers (Auth, Query, Toast, i18n).
 * Place this in: app/layout.tsx
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "myTrimmy-prep",
  description: "Welcome to myTrimmy-prep",
  openGraph: {
    title: "myTrimmy-prep",
    description: "Welcome to myTrimmy-prep",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "myTrimmy-prep",
    description: "Welcome to myTrimmy-prep",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
