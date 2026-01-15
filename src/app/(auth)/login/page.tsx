/**
 * Login Page - myTrimmy
 *
 * Digital Darkroom aesthetic login with ambient glow and refined typography.
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signInWithGoogle, type OAuthProvider } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { GuestGuard } from '@/components/auth-guard';

// ============================================================
// OAUTH PROVIDER ICONS
// ============================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}


// ============================================================
// COMPONENTS
// ============================================================

function OAuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground">
          Or continue with email
        </span>
      </div>
    </div>
  );
}

interface OAuthButtonsProps {
  readonly loading: boolean;
  readonly onOAuthClick: () => void;
  readonly isLoading: boolean;
}

function OAuthButtons({ loading, onOAuthClick, isLoading }: OAuthButtonsProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onOAuthClick}
      disabled={loading}
      aria-label="Sign in with Google"
      className="h-12 w-full gap-3"
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      ) : (
        <>
          <GoogleIcon className="h-5 w-5" />
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const authError = searchParams.get('error');
  const errorMessage = authError === 'auth_failed'
    ? 'Authentication failed. Please try again.'
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn({ email, password });

    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    router.push(returnUrl);
  }

  async function handleGoogleClick() {
    setError(null);
    setOauthLoading('google');

    const result = await signInWithGoogle(returnUrl);

    if (!result.ok) {
      setError(result.error.message);
      setOauthLoading(null);
    }
  }

  const isLoading = loading || oauthLoading !== null;

  return (
    <GuestGuard>
      <main className="relative flex min-h-screen items-center justify-center px-6 grain">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="group absolute left-6 top-6 flex items-center gap-3 opacity-0 animate-fade-in"
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition-all duration-300">
            <Image
              src="/icon-extracted.png"
              alt="Iconym"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="font-display text-lg tracking-tight text-foreground">Iconym</span>
        </Link>

        {/* Card */}
        <Card className="relative w-full max-w-md opacity-0 animate-fade-up">
          <CardHeader className="space-y-2 pb-4">
            <h1 className="font-display text-3xl font-medium tracking-tight">Welcome back</h1>
            <CardDescription className="text-base">
              Sign in to continue to your workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {(error || errorMessage) && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error || errorMessage}
              </div>
            )}

            {/* Google Sign In */}
            <OAuthButtons
              loading={isLoading}
              onOAuthClick={handleGoogleClick}
              isLoading={oauthLoading === 'google'}
            />

            <OAuthDivider />

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="glow-amber w-full" disabled={isLoading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-2">
            <p className="w-full text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary transition-colors hover:text-primary/80">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </GuestGuard>
  );
}

function LoginPageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 grain">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 pb-4">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-56 animate-pulse rounded-lg bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
