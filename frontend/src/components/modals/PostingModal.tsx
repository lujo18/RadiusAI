"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Calendar, Send, Save, Edit, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "@/components/animate-ui/primitives/radix/dialog";
import { PostSlidePreview } from "@/components/post/PostSlidePreview";
import { PostContentEditor } from "@/components/post/PostContentEditor";
import { TimeBlockScheduler } from "@/components/scheduling/TimeBlockScheduler";
import { SocialItem } from "@/components/platform-integrations/SocialItem";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostContent } from "@/lib/parseJsonColumn.supabase";
import { useScheduledPosts } from "@/lib/api/hooks/usePosts";
import { addDays } from "date-fns";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];
type Post = any;

type PostingMode = 'publish' | 'draft' | 'schedule';

type PostingModalProps = {
  visible: boolean;
  onClose: () => void;
  postData: Post;
  brandId: string;
  integrations?: PlatformIntegration[];
  onPost: (integrationIds: string[], mode: PostingMode, scheduledAt?: Date, updatedContent?: any) => Promise<void> | void;
  posting?: boolean;
};

export default function PostingModal({
  visible,
  onClose,
  postData,
  brandId,
  integrations = [],
  onPost,
  posting = false,
}: PostingModalProps) {
  const connected = integrations.filter((i) => i && i.status === "connected");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<'edit' | 'integrations' | 'schedule'>('edit');
  const [mode, setMode] = useState<PostingMode>('publish');
  const [selectedDateTime, setSelectedDateTime] = useState<Date>();

  // Content editing state
  const content = postData.content as PostContent;
  const [editableCaption, setEditableCaption] = useState(content?.caption || '');
  const [editableHashtags, setEditableHashtags] = useState<string[]>(content?.hashtags || []);
  const [platformCaptions, setPlatformCaptions] = useState<Record<string, string>>({});

  // Fetch scheduled posts for time block scheduler
  const fromDate = new Date();
  const toDate = addDays(new Date(), 30); // Next 30 days
  const { data: scheduledPosts } = useScheduledPosts(fromDate, toDate);

  useEffect(() => {
    if (visible) {
      // Reset to first step and preselect connected integrations
      setStep('edit');
      setMode('publish');
      setSelectedDateTime(undefined);
      
      const initial: Record<string, boolean> = {};
      connected.forEach((i) => {
        if (i && i.id) initial[i.id] = true;
      });
      setSelected(initial);

      // Reset content
      const content = postData.content as PostContent;
      setEditableCaption(content?.caption || '');
      setEditableHashtags(content?.hashtags || []);
      setPlatformCaptions({});
    }
  }, [visible, postData]);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    connected.forEach((i) => (all[i.id] = true));
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  const getSelectedIntegrations = () => {
    return Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  };

  const getSelectedPlatforms = () => {
    const selectedIds = getSelectedIntegrations();
    return connected
      .filter(i => selectedIds.includes(i.id))
      .map(i => i.platform);
  };

  const handleModeSelect = (selectedMode: PostingMode) => {
    setMode(selectedMode);
    if (selectedMode === 'schedule') {
      setStep('schedule');
    } else {
      handlePost(selectedMode);
    }
  };

  const handlePost = async (postingMode: PostingMode = mode) => {
    const ids = getSelectedIntegrations();
    if (ids.length === 0) return;

    const updatedContent = {
      ...content,
      caption: editableCaption,
      hashtags: editableHashtags,
      platform_captions: platformCaptions,
    };

    await onPost(ids, postingMode, selectedDateTime, updatedContent);
  };

  const canProceedFromEdit = () => {
    return editableCaption.trim().length > 0;
  };

  const canProceedFromIntegrations = () => {
    return getSelectedIntegrations().length > 0;
  };

  const canSchedule = () => {
    return selectedDateTime && getSelectedIntegrations().length > 0;
  };

  const storageUrls = postData.storage_urls as { slides?: string[] };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-50 fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="z-50 fixed inset-0 flex items-center justify-center p-4">
          <DialogContent className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Post Content</h2>
                <div className="flex items-center gap-1">
                  <Badge variant={step === 'edit' ? 'default' : 'secondary'}>
                    1. Edit
                  </Badge>
                  <Badge variant={step === 'integrations' ? 'default' : 'secondary'}>
                    2. Select Accounts
                  </Badge>
                  {mode === 'schedule' && (
                    <Badge variant={step === 'schedule' ? 'default' : 'secondary'}>
                      3. Schedule
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {step !== 'edit' && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step === 'schedule' ? 'integrations' : 'edit')}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {step === 'edit' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Post Preview</h3>
                    <PostSlidePreview 
                      slides={storageUrls?.slides || []} 
                      className="mb-6"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Edit Content</h3>
                    <PostContentEditor
                      caption={editableCaption}
                      hashtags={editableHashtags}
                      platformCaptions={platformCaptions}
                      onCaptionChange={setEditableCaption}
                      onHashtagsChange={setEditableHashtags}
                      onPlatformCaptionChange={(platform, caption) => 
                        setPlatformCaptions(prev => ({ ...prev, [platform]: caption }))
                      }
                      selectedPlatforms={getSelectedPlatforms()}
                    />

                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={() => setStep('integrations')}
                        disabled={!canProceedFromEdit()}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'integrations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Select Accounts</h3>
                      <p className="text-sm text-muted-foreground">Choose which social accounts to post to</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
                      <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
                      <Badge variant="secondary">{connected.length} connected</Badge>
                    </div>
                  </div>

                  {connected.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No connected accounts for this brand.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connected.map((integration) => (
                      <Card
                        key={integration.id}
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selected[integration.id] ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => toggle(integration.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={!!selected[integration.id]} 
                            onCheckedChange={() => toggle(integration.id)} 
                          />
                          <SocialItem 
                            platform={{ 
                              id: integration.platform, 
                              name: integration.platform, 
                              icon: () => null, 
                              color: 'bg-background' 
                            } as any} 
                            integration={integration} 
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {getSelectedIntegrations().length} accounts selected
                    </p>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleModeSelect('draft')}
                        disabled={!canProceedFromIntegrations() || posting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {posting ? 'Saving...' : 'Save as Draft'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleModeSelect('schedule')}
                        disabled={!canProceedFromIntegrations()}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        onClick={() => handleModeSelect('publish')}
                        disabled={!canProceedFromIntegrations() || posting}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {posting ? 'Posting...' : 'Post Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Schedule Post</h3>
                    <p className="text-sm text-muted-foreground">Choose when to publish your content</p>
                  </div>

                  <TimeBlockScheduler
                    selectedDateTime={selectedDateTime}
                    onTimeSelect={setSelectedDateTime}
                    scheduledPosts={scheduledPosts?.filter(post => post.scheduled_time).map(post => ({
                      id: post.id,
                      scheduled_time: post.scheduled_time!,
                      content: post.content as any
                    })) || []}
                  />

                  <div className="flex justify-between items-center pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      {getSelectedIntegrations().length} accounts selected
                      {selectedDateTime && (
                        <div className="mt-1">
                          Scheduled for {selectedDateTime.toLocaleDateString()} at {selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handlePost('schedule')}
                      disabled={!canSchedule() || posting}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {posting ? 'Scheduling...' : 'Schedule Post'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
