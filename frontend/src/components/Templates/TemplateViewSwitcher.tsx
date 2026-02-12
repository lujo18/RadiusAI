"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, LayoutList } from "lucide-react";
import TemplateTableView from "./TemplateTableView";
import { Template } from "@/types/template";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TemplateViewSwitcherProps {
  templates: Template[] | undefined;
  isLoading: boolean;
  brandId: string;
  onDelete: (templateId: string) => void;
  onCreateClick: () => void;
}

type ViewMode = "card" | "table";

export const TemplateViewSwitcher: React.FC<TemplateViewSwitcherProps> = ({
  templates,
  isLoading,
  brandId,
  onDelete,
  onCreateClick,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "card" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("card")}
          className="flex items-center gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          Card View
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
          className="flex items-center gap-2"
        >
          <LayoutList className="w-4 h-4" />
          Table View
        </Button>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            ))
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition hover:border-primary ${
                  template.is_default ? "border-primary" : ""
                }`}
                onClick={() => setViewMode("table")} // Optional: auto-switch to table view
              >
                {/* Header */}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs uppercase">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {template.is_default && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary"
                        >
                          Default
                        </Badge>
                      )}
                      {template.status === "testing" && (
                        <Badge
                          variant="secondary"
                          className="bg-chart-1/20 text-chart-1"
                        >
                          Testing
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

             
                {/* Performance Stats */}
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Posts</span>
                    <span className="font-semibold">
                      {(template as any).analytics?.postCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Avg Engagement
                    </span>
                    <span className="font-semibold text-chart-4">
                      {((template as any).analytics?.engagementRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Impressions</span>
                    <span className="font-semibold">
                      {(template as any).analytics?.impressions || 0}
                    </span>
                  </div>
                </CardContent>

                {/* Actions */}
                <CardContent className="flex gap-2 pt-4 border-t border">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/brand/${brandId}/template/${template.id}`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(template.id);
                    }}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-3">
              <CardContent className="text-center py-12">
                <Image
                  src="/images/icon-primary.png"
                  alt="Radius Logo"
                  width={48}
                  height={48}
                  className="mx-auto mb-4"
                />
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button onClick={onCreateClick}>Create Your First Template</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <TemplateTableView
          templates={templates}
          isLoading={isLoading}
          brandId={brandId}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default TemplateViewSwitcher;
