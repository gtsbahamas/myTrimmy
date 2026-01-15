/**
 * Landing Page - Iconym
 *
 * The last mile for your brand.
 * One logo in, 50+ production-ready assets out.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone, Globe, Share2, Download, Sparkles, Check } from 'lucide-react';
import { LandingNavbar } from '@/components/landing-navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background grain">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition-all duration-500">
              <Image
                src="/icon-extracted.png"
                alt="Iconym"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">Iconym</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#platforms" className="editorial-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              Platforms
            </Link>
            <Link href="#how-it-works" className="editorial-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </Link>
            <Link href="#pricing" className="editorial-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
          </div>

          {/* Auth Buttons - Dynamic based on auth state */}
          <LandingNavbar />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 opacity-0 animate-fade-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">The Last Mile for Your Brand</span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-8 font-display text-5xl font-medium leading-[1.1] tracking-tight text-foreground opacity-0 animate-fade-up delay-100 sm:text-6xl md:text-7xl lg:text-8xl">
            One logo in,
            <br />
            <span className="text-primary text-glow">50+ assets out</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground opacity-0 animate-fade-up delay-200 md:text-xl">
            iOS icons. Android adaptive icons. Favicons. PWA assets. Social cards.
            <br className="hidden md:block" />
            Generated in seconds, ready to ship.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 opacity-0 animate-fade-up delay-300 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="glow-amber h-14 bg-primary px-10 text-base font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02]"
            >
              <Link href="/signup">
                Generate Assets Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-border/50 bg-transparent px-10 text-base font-medium text-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-border/30 pt-12 opacity-0 animate-fade-up delay-400">
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">53</div>
              <div className="mt-1 text-sm text-muted-foreground">Assets Generated</div>
            </div>
            <div className="hidden h-8 w-px bg-border/50 sm:block" />
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">4</div>
              <div className="mt-1 text-sm text-muted-foreground">Platforms Covered</div>
            </div>
            <div className="hidden h-8 w-px bg-border/50 sm:block" />
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">&lt;10s</div>
              <div className="mt-1 text-sm text-muted-foreground">Generation Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="relative py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-20 max-w-2xl">
            <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Every platform,
              <br />
              <span className="text-primary">every size</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Stop manually resizing icons. Upload once, download everything you need
              for iOS, Android, Web, and Social Media.
            </p>
          </div>

          {/* Platform cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* iOS */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="mb-3 font-display text-xl font-medium text-foreground">iOS</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  18 icon sizes for iPhone, iPad, Apple Watch, and App Store.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Xcode-ready Contents.json
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    All @1x, @2x, @3x scales
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    1024x1024 App Store icon
                  </li>
                </ul>
              </div>
            </div>

            {/* Android */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="mb-3 font-display text-xl font-medium text-foreground">Android</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  16 icons including adaptive icon foregrounds and round variants.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Adaptive icon support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    All mipmap densities
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Play Store icon
                  </li>
                </ul>
              </div>
            </div>

            {/* Web */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <Globe className="h-7 w-7" />
                </div>
                <h3 className="mb-3 font-display text-xl font-medium text-foreground">Web & PWA</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  16 assets for favicons, Apple touch icons, PWA, and Windows tiles.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    favicon.ico + PNGs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    manifest.json included
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Maskable PWA icons
                  </li>
                </ul>
              </div>
            </div>

            {/* Social */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <Share2 className="h-7 w-7" />
                </div>
                <h3 className="mb-3 font-display text-xl font-medium text-foreground">Social Media</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  3 social sharing images for maximum reach.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Open Graph 1200x630
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    Twitter Card 1200x600
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    LinkedIn 1200x627
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative border-t border-border/30 py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Text content */}
            <div>
              <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
                Three steps to
                <br />
                <span className="text-primary">ship faster</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                No more opening Figma, Sketch, or Photoshop. No more manually exporting
                at different sizes. Just upload, configure, and download.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">1</div>
                  <div>
                    <div className="font-medium text-foreground">Upload your logo</div>
                    <div className="text-sm text-muted-foreground">PNG, JPEG, WebP, or SVG. Minimum 512x512 recommended.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">2</div>
                  <div>
                    <div className="font-medium text-foreground">Select your platforms</div>
                    <div className="text-sm text-muted-foreground">iOS, Android, Web, Social—or all of them.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">3</div>
                  <div>
                    <div className="font-medium text-foreground">Download your bundle</div>
                    <div className="text-sm text-muted-foreground">ZIP file with organized folders, config files, and documentation.</div>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-10 glow-amber h-14 bg-primary px-10 text-base font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90"
              >
                <Link href="/signup">
                  Try It Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Visual element */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8">
                <div className="flex h-full flex-col items-center justify-center gap-6">
                  {/* Upload icon */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                    <Download className="h-12 w-12 text-primary" />
                  </div>
                  {/* Arrow */}
                  <ArrowRight className="h-8 w-8 rotate-90 text-primary/50" />
                  {/* Platform icons grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-lg bg-primary/10 transition-all duration-300 hover:bg-primary/20"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative border-t border-border/30 py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Simple pricing,
            <br />
            <span className="text-primary">no subscriptions</span>
          </h2>
          <p className="mb-16 text-lg text-muted-foreground">
            Start free, pay once to unlock everything forever.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-2xl border border-border/50 bg-card p-8 text-left">
              <div className="mb-4 text-sm font-medium text-muted-foreground">Free</div>
              <div className="mb-6">
                <span className="font-display text-4xl font-medium text-foreground">$0</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  10 bundles per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  All platforms included
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Standard processing
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-8 text-left">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                Popular
              </div>
              <div className="mb-4 text-sm font-medium text-primary">Pro — One-time</div>
              <div className="mb-6">
                <span className="font-display text-4xl font-medium text-foreground">$19</span>
                <span className="text-sm text-muted-foreground"> forever</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited bundles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority processing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Framework code snippets
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  No watermarks or branding
                </li>
              </ul>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                  Get Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-border/30 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Ready to ship
            <br />
            <span className="text-primary">your next app?</span>
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Stop wasting time on asset generation. Focus on building what matters.
          </p>
          <Button
            asChild
            size="lg"
            className="glow-amber animate-glow-pulse h-16 bg-primary px-14 text-lg font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90"
          >
            <Link href="/signup">
              Generate Assets Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. 10 free bundles per month.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
                <Image
                  src="/icon-extracted.png"
                  alt="Iconym"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="font-display text-xl tracking-tight text-foreground">Iconym</span>
            </Link>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <Link href="#platforms" className="transition-colors hover:text-foreground">Platforms</Link>
              <Link href="#how-it-works" className="transition-colors hover:text-foreground">How It Works</Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
              <Link href="/login" className="transition-colors hover:text-foreground">Sign In</Link>
              <Link href="/signup" className="text-primary transition-colors hover:text-primary/80">Get Started</Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Iconym
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
