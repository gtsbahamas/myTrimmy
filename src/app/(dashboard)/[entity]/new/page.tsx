/**
 * Create Entity Page - /[entity]/new
 * Generated: 2026-01-14
 *
 * Dynamic create page that renders the appropriate form based on entity type.
 * Place in: app/(dashboard)/[entity]/new/page.tsx
 */

"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ entity: string }>;
}

export default function CreateEntityPage({ params }: PageProps) {
  const { entity } = use(params);
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/${entity}`);
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  // Entity display names (support both singular and plural URL paths)
  const entityLabels: Record<string, { singular: string; plural: string }> = {
  };

  const labels = entityLabels[entity] || { singular: entity, plural: entity };

  // Render the appropriate form based on entity type (support both singular and plural URL paths)
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
