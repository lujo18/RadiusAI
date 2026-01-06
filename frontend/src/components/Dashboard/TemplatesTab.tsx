"use client";

import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
// NOTE: All template objects from the backend use snake_case keys (e.g., is_default, performance.total_posts)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
} from "@/lib/api/hooks";
import TemplateCreator from "@/components/TemplateCreator/index";

const TemplatesTab = ({ brandId }: { brandId: string }) => {
  const {
    data: templates,
    isLoading: templatesLoading,
  } = useTemplates(brandId);

  const handleSaveTemplate = (templateData: any) => {
    console.log("Client Create Template", { ...templateData, brandId: brandId })

    createTemplateMutation.mutate(
      { ...templateData, brandId: brandId },
      {
        onSuccess: () => {
          setShowCreateModal(false);
        },
      }
    );
  };
  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplateMutation.mutate(templateId);
  };

  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold font-main mb-2">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage slide templates for A/B testing
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <Image
            src="/images/icon-primary.png"
            alt="Radius Logo"
            width={24}
            height={24}
          />
          Create Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {templatesLoading ? (
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
          templates.map((template: any) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition hover:border-primary ${
                template.is_default ? "border-primary" : ""
              }`}
              onClick={() => setSelectedTemplate(template.id)}
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
                    {template.performance?.total_posts || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Engagement</span>
                  <span className="font-semibold text-chart-4">
                    {template.performance?.avg_engagement_rate || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Saves</span>
                  <span className="font-semibold">
                    {template.performance?.avg_saves || 0}
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
                    router.push(`/brand/template/${template.id}`);
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
                    handleDeleteTemplate(template.id);
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
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary mb-2">
              {templates?.filter((t: any) => t.status === "active").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Active Templates
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {templates && templates.length > 0
                ? (
                    templates.reduce(
                      (sum: number, t: any) =>
                        sum + (t.performance?.avg_engagement_rate || 0),
                      0
                    ) / templates.length
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
            <div className="text-sm text-muted-foreground">
              Avg Engagement Rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {templates?.reduce(
                (sum: number, t: any) =>
                  sum + (t.performance?.total_posts || 0),
                0
              ) || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Posts Generated
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {templates?.filter((t: any) => t.status === "testing").length ||
                0}
            </div>
            <div className="text-sm text-muted-foreground">
              A/B Tests Running
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Creator Modal */}
      {showCreateModal && (
        <TemplateCreator
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};

export default TemplatesTab;
