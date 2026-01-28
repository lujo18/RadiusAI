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
import TemplateViewSwitcher from "@/components/Templates/TemplateViewSwitcher";

const TemplatesTab = ({ brandId }: { brandId: string }) => {
  const { data: templates, isLoading: templatesLoading } =
    useTemplates(brandId);

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
    deleteTemplateMutation.mutate(templateId);
  };

  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold font-main mb-2">Templates</h1>
            <p className="text-muted-foreground">
              Create and manage slide templates for A/B testing
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateModal(true);
            }}
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

        {/* Template View Switcher */}
        <TemplateViewSwitcher
          templates={templates}
          isLoading={templatesLoading}
          brandId={brandId}
          onDelete={handleDeleteTemplate}
          onCreateClick={() => setShowCreateModal(true)}
        />

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {templates?.filter((t: any) => t.status === "active").length ||
                  0}
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
                        0,
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
                  0,
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
      </div>

      <TemplateCreator
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveTemplate}
      />
    </>
  );
};

export default TemplatesTab;
