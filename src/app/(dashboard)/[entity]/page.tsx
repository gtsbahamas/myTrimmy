/**
 * Entity Page (Server Component) - myTrimmy-prep
 *
 * Validates entity parameter and returns 404 for unknown entities.
 * Delegates rendering to client component for valid entities.
 */

import { notFound } from 'next/navigation';
import { EntityPageClient, entityMap } from './entity-page-client';

// Only allow statically known entities - return true 404 for unknown slugs
export const dynamicParams = false;

export function generateStaticParams() {
  // Return all valid entity slugs
  return Object.keys(entityMap).map((entity) => ({ entity }));
}

interface PageProps {
  params: Promise<{ entity: string }>;
}

/**
 * Server component that validates entity exists before rendering.
 * Returns proper 404 status for unknown entities.
 */
export default async function EntityPage({ params }: PageProps) {
  const { entity } = await params;

  // Check if entity is valid - if not, return 404
  if (!entityMap[entity]) {
    notFound();
  }

  return <EntityPageClient entity={entity} />;
}
