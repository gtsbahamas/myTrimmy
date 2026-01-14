/**
 * Entity Pages - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * CRUD pages for each entity: List, Detail, Create, and Edit views.
 * Integrates with API hooks, form components, and data display components.
 *
 * Place these in your app directory:
 *   - app/(dashboard)//page.tsx (list)
 *   - app/(dashboard)//[id]/page.tsx (detail)
 *   - app/(dashboard)//new/page.tsx (create)
 *   - app/(dashboard)//[id]/edit/page.tsx (edit)
 *
 * Usage:
 *   // List page
 *   export default function sPage() {
 *     return <ListPage />;
 *   }
 *
 *   // Detail page
 *   export default function Page({ params }: { params: { id: string } }) {
 *     return <DetailPage id={params.id} />;
 *   }
 */

'use client';

import { useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

// Auth
import { AuthGuard } from '@/components/auth-guard';

// Data Display
import {
  DataTable,
  Pagination,
  PaginationInfo,
  PageSizeSelect,
  LoadingSpinner,
  LoadingSkeleton,
  EmptyState,
  usePagination,
} from '@/components/data-display';

// Forms
import { FormError, FormSuccess } from '@/components/forms';


// ============================================================
// SHARED ICONS (inline SVGs for zero dependencies)
// ============================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}


// ============================================================
// DEFAULT EXPORT - Dynamic Entity Router
// ============================================================

interface PageProps {
  params: Promise<{ entity: string }>;
}

/**
 * Dynamic route handler for entity list pages.
 * Routes /users to UserListPage, /organizations to OrganizationListPage, etc.
 */
export default function EntityPage({ params }: PageProps) {
  const { entity } = use(params);

  // Map entity slug to list component (support both singular and plural URL paths)
  const entityMap: Record<string, React.ComponentType> = {
  };

  const ListComponent = entityMap[entity];

  if (!ListComponent) {
    return (
      <AuthGuard>
        <main className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Not Found</CardTitle>
              <CardDescription>
                The entity &quot;{entity}&quot; does not exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Available entities: {Object.keys(entityMap).join(', ')}
              </p>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  return <ListComponent />;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
