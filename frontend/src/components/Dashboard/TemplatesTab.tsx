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
  useTemplatesWithAnalytics,
} from "@/features/templates/hooks";
import { useGetTemplateUsage } from "@/features/usage/hooks";
import TemplateCreator from "@/components/TemplateCreator/index";
import TemplateViewSwitcher from "@/components/Templates/TemplateViewSwitcher";

const TemplatesTab = ({ brandId }: { brandId: string }) => {
  const { data: templates, isLoading: templatesLoading } =
    useTemplatesWithAnalytics(brandId);
  const { data: templateUsage } = useGetTemplateUsage(brandId);


  console.log("template usage", templateUsage)
  console.log("templates", templates);
  const templatesArr = templates as any[];

  const handleSaveTemplate = (templateData: any) => {
    console.log("Client Create Template", {
      ...templateData,
      brand_id: brandId,
    });

    createTemplateMutation.mutate(
      { ...templateData, brand_id: brandId },
      {
        onSuccess: () => {
          setShowCreateModal(false);
        },
      },
    );
  };
  const handleDeleteTemplate = (templateId: string) => {
    (deleteTemplateMutation as any).mutate(templateId);
  };

  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  const templateCount = templateUsage?.template_count ?? 0;
  const templatesRemaining = templateUsage?.remaining ?? 0;
  const templateLimit = templateUsage?.template_limit ?? 0;
  
  const isTemplateLimitReached =
    templateLimit !== null &&
    templatesRemaining !== undefined &&
    templatesRemaining <= 0;

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold font-main mb-2">Templates</h1>
            <p className="text-muted-foreground">
              Create and manage slide templates for A/B testing
            </p>
            {templateCount !== null && (
              <p className="text-sm text-muted-foreground mt-2">
                Templates:{" "}
                <span className="font-semibold text-foreground">
                  {templateCount} / {templateLimit}
                </span>
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setShowCreateModal(true);
            }}
            disabled={
              isTemplateLimitReached || createTemplateMutation.isPending
            }
            title={
              isTemplateLimitReached
                ? "Template limit reached. Upgrade your plan to create more templates."
                : ""
            }
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-3 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src="/images/icon-primary.png"
              alt="Radius Logo"
              width={24}
              height={24}
              className="dark:brightness-0"
            />
            Create Template
          </Button>
        </div>

        {/* Template View Switcher */}
        <TemplateViewSwitcher
          templates={templates as any[]}
          isLoading={templatesLoading}
          brandId={brandId}
          onDelete={handleDeleteTemplate}
          onCreateClick={() => setShowCreateModal(true)}
        />

        {/* Template Creator Modal */}
      </div>

      <TemplateCreator
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveTemplate}
        templateUsage={{
          template_count: templateCount,
          template_limit: templateLimit,
          remaining: templatesRemaining,
        }}
      />
    </>
  );
};

export default TemplatesTab;
