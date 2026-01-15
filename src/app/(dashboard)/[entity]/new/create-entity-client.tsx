/**
 * Create Entity Client Component - myTrimmy-prep
 *
 * Client-side UI for entity creation pages.
 */

"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Entity labels (support both singular and plural URL paths)
// Add entries here as entities are created
export const entityLabels: Record<string, { singular: string; plural: string }> = {
  // Example: 'users': { singular: 'User', plural: 'Users' },
};

interface CreateEntityClientProps {
  entity: string;
}

export function CreateEntityClient({ entity }: CreateEntityClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/${entity}`);
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  const labels = entityLabels[entity] || { singular: entity, plural: entity };

  // Render the appropriate form based on entity type
  const renderForm = () => {
    switch (entity) {
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Unknown entity type: {entity}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/${entity}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {labels.plural}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create {labels.singular}</CardTitle>
          <CardDescription>
            Add a new {labels.singular.toLowerCase()} to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderForm()}
        </CardContent>
      </Card>
    </div>
  );
}
