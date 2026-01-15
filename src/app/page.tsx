/**
 * Landing Page - myTrimmy
 *
 * Digital Darkroom aesthetic: Dark, moody, with amber/gold accents.
 * Editorial serif headlines, generous whitespace, cinematic animations.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Crop, Layers, Download, Sparkles, Image as ImageIcon, Palette } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background grain">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Warm amber glow - top right */}
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
        {/* Secondary glow - bottom left */}
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        {/* Center subtle glow */}
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 transition-all duration-500 group-hover:bg-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <span className="relative font-display text-xl font-semibold text-primary">m</span>
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">myTrimmy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="editorial-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#workflow" className="editorial-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              Workflow
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="glow-amber bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 opacity-0 animate-fade-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Professional Image Processing</span>
          </div>

          {/* Main Headline - Editorial serif */}
          <h1 className="mb-8 font-display text-5xl font-medium leading-[1.1] tracking-tight text-foreground opacity-0 animate-fade-up delay-100 sm:text-6xl md:text-7xl lg:text-8xl">
            Transform your images
            <br />
            <span className="text-primary text-glow">with precision</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground opacity-0 animate-fade-up delay-200 md:text-xl">
            Batch processing, format conversion, and optimization—all in one elegant workspace.
            Built for photographers, designers, and creative professionals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 opacity-0 animate-fade-up delay-300 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="glow-amber h-14 bg-primary px-10 text-base font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02]"
            >
              <Link href="/signup">
                Start Processing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-border/50 bg-transparent px-10 text-base font-medium text-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-12 border-t border-border/30 pt-12 opacity-0 animate-fade-up delay-400">
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">10M+</div>
              <div className="mt-1 text-sm text-muted-foreground">Images Processed</div>
            </div>
            <div className="hidden h-8 w-px bg-border/50 sm:block" />
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">50+</div>
              <div className="mt-1 text-sm text-muted-foreground">Export Formats</div>
            </div>
            <div className="hidden h-8 w-px bg-border/50 sm:block" />
            <div className="text-center">
              <div className="font-display text-3xl font-medium text-foreground">2x</div>
              <div className="mt-1 text-sm text-muted-foreground">Faster Workflow</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-20 max-w-2xl">
            <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Everything you need,
              <br />
              <span className="text-primary">nothing you don&apos;t</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Powerful tools that stay out of your way. Focus on your creative vision
              while we handle the technical complexity.
            </p>
          </div>

          {/* Features grid - asymmetric layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 - Large card */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80 md:col-span-2 lg:col-span-1 lg:row-span-2">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <Crop className="h-7 w-7" />
                </div>
                <h3 className="mb-4 font-display text-2xl font-medium text-foreground">Smart Cropping</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Intelligent aspect ratio detection and batch cropping with pixel-perfect precision.
                  Set your parameters once, apply to thousands.
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm text-primary">
                  <span>Learn more</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-xl font-medium text-foreground">Format Conversion</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Convert between 50+ formats with zero quality loss. WebP, AVIF, HEIC, and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                <Download className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-xl font-medium text-foreground">Batch Export</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Export to multiple sizes and formats simultaneously. Perfect for responsive assets.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-xl font-medium text-foreground">App Icons & Favicons</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Generate complete asset bundles for iOS, Android, and web from a single source.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:bg-card/80">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                <Palette className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-xl font-medium text-foreground">Color Optimization</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Automatic color profile conversion and optimization for web and print.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="relative border-t border-border/30 py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Text content */}
            <div>
              <h2 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
                Your workflow,
                <br />
                <span className="text-primary">elevated</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                Stop wasting hours on repetitive tasks. Set up your processing pipeline once,
                then let myTrimmy handle the rest while you focus on what matters—your creative work.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">1</div>
                  <div>
                    <div className="font-medium text-foreground">Upload your images</div>
                    <div className="text-sm text-muted-foreground">Drag and drop or select files. We support all major formats.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">2</div>
                  <div>
                    <div className="font-medium text-foreground">Configure your settings</div>
                    <div className="text-sm text-muted-foreground">Choose your output format, dimensions, and quality.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm text-primary">3</div>
                  <div>
                    <div className="font-medium text-foreground">Download your assets</div>
                    <div className="text-sm text-muted-foreground">Get perfectly optimized images ready for any platform.</div>
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

            {/* Visual element - abstract preview */}
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-3xl border border-border/50 bg-card/50 p-8">
                <div className="grid h-full grid-cols-3 gap-4">
                  <div className="col-span-2 row-span-2 rounded-2xl bg-primary/5 transition-all duration-500 hover:bg-primary/10" />
                  <div className="rounded-2xl bg-primary/10 transition-all duration-500 hover:bg-primary/20" />
                  <div className="rounded-2xl bg-primary/8 transition-all duration-500 hover:bg-primary/15" />
                  <div className="rounded-2xl bg-primary/5 transition-all duration-500 hover:bg-primary/10" />
                  <div className="col-span-2 rounded-2xl bg-primary/8 transition-all duration-500 hover:bg-primary/15" />
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
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
            Ready to streamline
            <br />
            <span className="text-primary">your workflow?</span>
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Join thousands of professionals who trust myTrimmy for their image processing needs.
          </p>
          <Button
            asChild
            size="lg"
            className="glow-amber animate-glow-pulse h-16 bg-primary px-14 text-lg font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90"
          >
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Free tier includes 100 images/month.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="font-display text-xl font-semibold text-primary">m</span>
              </div>
              <span className="font-display text-xl tracking-tight text-foreground">myTrimmy</span>
            </Link>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
              <Link href="#workflow" className="transition-colors hover:text-foreground">Workflow</Link>
              <Link href="/login" className="transition-colors hover:text-foreground">Sign In</Link>
              <Link href="/signup" className="text-primary transition-colors hover:text-primary/80">Get Started</Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} myTrimmy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
