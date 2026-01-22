'use client';

import * as React from 'react';
import { Link2, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function UrlInput({ onSubmit, isLoading = false, error }: UrlInputProps) {
  const [url, setUrl] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      // Add protocol if missing
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      onSubmit(finalUrl);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-2xl border-2 bg-card/50 backdrop-blur-sm",
            "transition-all duration-300",
            error
              ? "border-destructive/50"
              : "border-border/50 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10"
          )}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary ml-1">
            <Link2 className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com"
            disabled={isLoading}
            className={cn(
              "flex-1 bg-transparent border-none outline-none text-lg",
              "placeholder:text-muted-foreground/50",
              "disabled:opacity-50"
            )}
            autoFocus
          />

          <Button
            type="submit"
            size="lg"
            disabled={!url.trim() || isLoading}
            className="rounded-xl px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Analyze
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive text-center">{error}</p>
        )}
      </form>

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Paste any URL. We&apos;ll analyze your site and generate promo videos for every platform.
      </p>
    </div>
  );
}
