/**
 * Landing Navbar - Auth-aware navigation for the landing page
 *
 * Shows different buttons based on authentication state:
 * - Logged in: Dashboard + Sign Out
 * - Logged out: Sign In + Get Started
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';

export function LandingNavbar() {
  const { user, loading, signOut } = useAuth();

  // Show skeleton while loading to prevent layout shift
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  // Authenticated user
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={signOut}
          className="border-border/50 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  // Guest user
  return (
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
  );
}
