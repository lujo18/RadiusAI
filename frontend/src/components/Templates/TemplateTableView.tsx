"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Template } from "@/types/template";

interface TemplateTableViewProps {
  templates: Template[] | undefined;
  isLoading: boolean;
  brandId: string;
  onDelete: (templateId: string) => void;
}

export const TemplateTableView: React.FC<TemplateTableViewProps> = ({
  templates,
  isLoading,
  brandId,
  onDelete,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No templates yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[150px]">Category</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px] text-right">Total Posts</TableHead>
            <TableHead className="w-[150px] text-right">
              Avg Engagement
            </TableHead>
            <TableHead className="w-[120px] text-right">Avg Saves</TableHead>
            <TableHead className="w-[200px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow
              key={template.id}
              className={`${
                template.is_default ? "bg-primary/5" : ""
              } hover:bg-foreground/5 transition-colors`}
            >
              <TableCell className="font-medium">
                <div>
                  <p className="font-semibold">{template.name}</p>
                  {template.is_default && (
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-primary/20 text-primary text-xs"
                    >
                      Default
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs uppercase">
                  {template.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`text-xs uppercase ${
                    template.status === "testing"
                      ? "bg-chart-1/20 text-chart-1"
                      : ""
                  }`}
                >
                  {template.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">
                  {(template as any).performance?.total_posts || 0}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-chart-4">
                  {((template as any).performance?.avg_engagement_rate || 0).toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">
                  {(template as any).performance?.avg_saves || 0}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/brand/${brandId}/template/${template.id}`
                      )
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemplateTableView;
