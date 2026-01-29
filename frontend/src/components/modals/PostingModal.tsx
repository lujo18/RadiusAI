"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "@/components/animate-ui/primitives/radix/dialog";
import { PostItem } from "@/components/items/PostItem";
import { SocialItem } from "@/components/platform-integrations/SocialItem";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/types/database";
import { Badge } from "@/components/ui/badge";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];
type Post = any;

type PostingModalProps = {
  visible: boolean;
  onClose: () => void;
  postData: Post;
  brandId: string;
  integrations?: PlatformIntegration[];
  onPost: (integrationIds: string[]) => Promise<void> | void;
  posting?: boolean;
};

export default function PostingModal({
  visible,
  onClose,
  postData,
  integrations = [],
  onPost,
  posting = false,
}: PostingModalProps) {
  const connected = integrations.filter((i) => i && i.status === "connected");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // preselect connected integrations
    const initial: Record<string, boolean> = {};
    connected.forEach((i) => {
      if (i && i.id) initial[i.id] = true;
    });
    setSelected(initial);
  }, [visible]);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    connected.forEach((i) => (all[i.id] = true));
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  const handlePost = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    await onPost(ids);
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-50 fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="z-50 fixed inset-0 flex items-center justify-center p-4">
          <DialogContent className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Post Preview</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <PostItem postData={postData} />
          </div>

          <aside className="md:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Share to</h3>
              <Badge variant="secondary">{connected.length} connected</Badge>
            </div>

            {connected.length === 0 && (
              <p className="text-sm text-muted-foreground">No connected accounts for this brand.</p>
            )}

            <div className="space-y-3">
              {connected.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-2 rounded-lg border border-border/10">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={!!selected[integration.id]} onCheckedChange={() => toggle(integration.id)} />
                    <SocialItem platform={{ id: integration.platform, name: integration.platform, icon: () => null, color: 'bg-background' } as any} integration={integration} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/10">
              <Button className="w-full" onClick={handlePost} disabled={posting || Object.values(selected).every((v) => !v)}>
                {posting ? "Posting…" : "Post"}
              </Button>
            </div>
          </aside>
            </div>
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
