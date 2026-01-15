/**
 * Entity Page Client Component - myTrimmy-prep
 *
 * Client-side UI for entity list pages.
 * The server component validates the entity and calls notFound() if invalid.
 */

'use client';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Auth
import { AuthGuard } from '@/components/auth-guard';

// ============================================================
// VALID ENTITY LIST COMPONENTS
// ============================================================

// Map entity slug to list component (support both singular and plural URL paths)
// Add entries here as entities are created
export const entityMap: Record<string, React.ComponentType> = {
  // Example: 'users': UserListPage,
  // Example: 'organizations': OrganizationListPage,
};

// ============================================================
// ENTITY PAGE CLIENT
// ============================================================

interface EntityPageClientProps {
  entity: string;
}

/**
 * Client component for rendering entity list pages.
 * Only called after server-side validation confirms entity exists.
 */
export function EntityPageClient({ entity }: EntityPageClientProps) {
  const ListComponent = entityMap[entity];

  // This shouldn't happen if server validation is correct, but handle gracefully
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
                Available entities: {Object.keys(entityMap).join(', ') || 'None configured'}
              </p>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  return <ListComponent />;
}
