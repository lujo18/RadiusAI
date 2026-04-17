"use client";

import { useState, useEffect, useMemo } from "react";
import { differenceInSeconds } from "date-fns";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostItem } from "@/components/items/PostItem";
import { usePostingModal } from "@/components/modals/PostingModalProvider";
import { useBrandIntegrations } from "@/features/brand/hooks";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  FileWarning,
  List,
  ChevronDown,
} from "lucide-react";
import { SlideCarouselEditor } from "./SlideCarouselEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GenerationRequest = {
  id: string;
  templateId?: string;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  result?: any[];
  error?: string;
};

type GenerationQueuePanelProps = {
  queue: GenerationRequest[];
};

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
      className="text-xs text-primary hover:underline"
    >
      Post
    </button>
  );
}

export function GenerationQueuePanel({ queue }: GenerationQueuePanelProps) {
  const [now, setNow] = useState(new Date());
  const [selectedPostIndex, setSelectedPostIndex] = useState<string>("0");

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Extract completed posts for the slide editor
  const completedPosts = useMemo(() => {
    return queue
      .filter(
        (request) => request.status === "completed" && request.result?.[0],
      )
      .map((request) => request.result![0]);
  }, [queue]);

  // Get the currently selected post
  const selectedPost = useMemo(() => {
    const index = parseInt(selectedPostIndex, 10);
    return completedPosts[index] || null;
  }, [completedPosts, selectedPostIndex]);

  // Reset selected index if it's out of bounds
  useEffect(() => {
    if (parseInt(selectedPostIndex, 10) >= completedPosts.length) {
      setSelectedPostIndex("0");
    }
  }, [completedPosts.length, selectedPostIndex]);

  return (
    <Card className="h-full flex w-full flex-col space-y-4 overflow-hidden">
      {/* Output Selector Dropdown */}
      {completedPosts.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground/70">
            Preview:
          </label>
          <Select
            value={selectedPostIndex}
            onValueChange={setSelectedPostIndex}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select output to preview" />
            </SelectTrigger>
            <SelectContent>
              {completedPosts.map((post, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Generation {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Slide Editor - Main scrolling view */}
      {selectedPost && (
        <div className="flex-1 overflow-hidden">
          <SlideCarouselEditor posts={[selectedPost]} aspectRatio="4:5" />
        </div>
      )}

      {/* Generation Queue */}

      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Generation Queue{" "}
          <span className="text-secondary">({queue.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {queue.map((request) => {
            let sec;

            if (request.status === "generating" || !request.completedAt) {
              sec = differenceInSeconds(now, new Date(request.createdAt));
            } else {
              sec = differenceInSeconds(
                new Date(request.completedAt),
                new Date(request.createdAt),
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
                    <Badge variant="secondary" className="text-xs gap-2 p-2">
                      <List size={16} />
                      {request.error}
                    </Badge>
                  )}
                  {request.status === "generating" && (
                    <span className="text-xs text-primary animate-pulse">
                      Generating...
                    </span>
                  )}
                  {request.status === "completed" && (
                    <Badge
                      variant="outline"
                      className="border-primary text-primary text-xs gap-2 p-2"
                    >
                      <CheckCircle size={16} />
                      {request.error}
                    </Badge>
                  )}
                  {request.status === "failed" && (
                    <Badge
                      variant="outline"
                      className="border-destructive text-destructive text-xs gap-2 p-2"
                    >
                      <AlertCircle size={16} />
                      {request.error}
                    </Badge>
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
