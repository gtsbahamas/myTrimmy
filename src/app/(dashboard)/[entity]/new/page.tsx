/**
 * Create Entity Page (Server Component) - myTrimmy-prep
 *
 * Validates entity parameter and returns 404 for unknown entities.
 */

import { notFound } from 'next/navigation';
import { CreateEntityClient, entityLabels } from './create-entity-client';

interface PageProps {
  params: Promise<{ entity: string }>;
}

export default async function CreateEntityPage({ params }: PageProps) {
  const { entity } = await params;

  // Check if entity is valid - if not, return 404
  if (!entityLabels[entity]) {
    notFound();
  }

  return <CreateEntityClient entity={entity} />;
}
