"use client";

import { useState, useEffect } from "react";
import { differenceInSeconds } from "date-fns";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostItem } from "@/components/items/PostItem";
import { usePostingModal } from "@/components/modals/PostingModalProvider";
import { useBrandIntegrations } from "@/features/brand/hooks";

type GenerationRequest = {
  id: string;
  templateId?: string;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  result?: any[];
  error?: string;
};

type GenerationQueueProps = {
  queue: GenerationRequest[];
};

export function GenerationQueue({ queue }: GenerationQueueProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <Card className="min-h-svh">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Generation Queue <span className="text-secondary">({queue.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {queue.map((request) => {
            let sec;

            if (request.status === "generating" || !request.completedAt) {
              sec = differenceInSeconds(now, new Date(request.createdAt));
            } else {
              sec = differenceInSeconds(
                new Date(request.completedAt),
                new Date(request.createdAt)
              );
            }

            if (
              request.result &&
              request.status === "completed" &&
              request.result[0]
            ) {
              const generated = request.result[0];
              return (
                <div key={request.id} className="space-y-2">
                  <PostItem postData={generated} />
                  <div className="flex justify-end">
                    <PostFromGenerate post={generated} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-foreground/10"
              >
                <div className="flex-1">
                  <div className="gap-4">
                    <p className="text-sm font-medium">
                      {request.templateId ? "Template-based" : "Prompt-based"}{" "}
                      generation
                    </p>
                    <span
                      className={`text-xs text-primary ${request.status === "generating" && "animate-pulse"}`}
                    >
                      {sec} seconds
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60">
                    {request.templateId}
                    ...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {request.status === "pending" && (
                    <span className="text-xs text-foreground/50">Queued</span>
                  )}
                  {request.status === "generating" && (
                    <span className="text-xs text-primary animate-pulse">
                      Generating...
                    </span>
                  )}
                  {request.status === "completed" && (
                    <span className="text-xs text-green-500">✓ Done</span>
                  )}
                  {request.status === "failed" && (
                    <span className="text-xs text-destructive">✗ Failed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PostFromGenerate({ post }: { post: any }) {
  const params = useParams();
  const brandId = params?.brandId as string;
  const postingModal = usePostingModal();
  const { data: integrations } = useBrandIntegrations(brandId);

  return (
    <button
      onClick={() =>
        postingModal.open({ postData: post, brandId, integrations })
      }
      className="px-3 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80"
    >
      Post
    </button>
  );
}
