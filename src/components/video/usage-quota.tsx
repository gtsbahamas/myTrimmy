'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageQuotaProps {
  used: number;
  limit: number | null; // null = unlimited
  plan: string;
  className?: string;
}

export function UsageQuota({ used, limit, plan, className }: UsageQuotaProps) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const remaining = isUnlimited ? Infinity : Math.max(limit - used, 0);
  const isLow = !isUnlimited && remaining <= 1;
  const isExhausted = !isUnlimited && remaining === 0;

  const planLabels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    studio: 'Studio',
    studio_annual: 'Studio',
    agency: 'Agency',
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-xl border",
      isExhausted ? "border-destructive/50 bg-destructive/5" :
      isLow ? "border-amber-500/50 bg-amber-500/5" :
      "border-border/50 bg-card/30",
      className
    )}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg",
        plan === 'agency' ? "bg-purple-500/10 text-purple-500" :
        plan.includes('studio') ? "bg-primary/10 text-primary" :
        "bg-muted text-muted-foreground"
      )}>
        {plan === 'agency' ? (
          <Crown className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {planLabels[plan] || plan} Plan
          </span>
          <span className={cn(
            "text-xs",
            isExhausted ? "text-destructive" :
            isLow ? "text-amber-500" :
            "text-muted-foreground"
          )}>
            {isUnlimited ? (
              'Unlimited'
            ) : (
              `${remaining} of ${limit} left`
            )}
          </span>
        </div>

        {!isUnlimited && (
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isExhausted ? "bg-destructive" :
                isLow ? "bg-amber-500" :
                "bg-primary"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {isExhausted && (
        <Link
          href="/settings"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
