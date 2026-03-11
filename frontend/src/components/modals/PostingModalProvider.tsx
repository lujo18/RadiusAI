"use client";

import React, { createContext, useContext, useState } from "react";
import { usePublishPost, useDraftPost, useSchedulePost, useUpdatePost } from '@/features/posts/hooks';
import PostingModal from "./PostingModal";
import { Database } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];
type PostPayload = any;
type PostingMode = 'publish' | 'draft' | 'schedule';

type OpenOptions = {
  postData: PostPayload;
  brandId?: string;
  integrations?: PlatformIntegration[];
};

type PostingModalContextValue = {
  open: (opts: OpenOptions) => void;
  close: () => void;
};

const PostingModalContext = createContext<PostingModalContextValue | null>(null);

export const PostingModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [postData, setPostData] = useState<PostPayload | null>(null);
  const [integrations, setIntegrations] = useState<PlatformIntegration[] | undefined>(undefined);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [posting, setPosting] = useState(false);
  
  const { toast } = useToast();
  const { mutateAsync: publishAsync, error: publishError } = usePublishPost(brandId || "");
  const { mutateAsync: draftAsync, error: draftError } = useDraftPost(brandId || "");
  const { mutateAsync: scheduleAsync, error: scheduleError } = useSchedulePost(brandId || "");
  const { mutateAsync: updatePostAsync, error: updatePostError } = useUpdatePost(brandId || "");

  const open = (opts: OpenOptions) => {
    setPostData(opts.postData);
    setIntegrations(opts.integrations);
    setBrandId(opts.brandId);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setPostData(null);
    setIntegrations(undefined);
    setBrandId(undefined);
    setPosting(false);
  };

  const handlePost = async (
    integrationIds: string[], 
    mode: PostingMode, 
    scheduledAt?: Date, 
    updatedContent?: any
  ) => {
    setPosting(true);
    try {
      const selectedIntegrations = (integrations || []).filter((i) => integrationIds.includes(i.id));
      const platforms = Array.from(new Set(selectedIntegrations.map((i) => i.platform)));
      const postId = (postData as any)?.id;

      if (!postId) {
        throw new Error("No post ID provided");
      }

      // Update post content if it was edited
      if (updatedContent) {
        await updatePostAsync({
          postId,
          updates: { content: updatedContent }
        });
      }


      let result;
      switch (mode) {
        case 'publish':
          result = await publishAsync({ postId, platforms });
          toast({
            title: "Post published",
            description: "Your post has been published successfully.",
          });
          break;
        case 'draft':
          result = await draftAsync({ postId, platforms });
          toast({
            title: "Draft saved",
            description: "Your post has been saved as a draft.",
          });
          break;
        case 'schedule':
          if (!scheduledAt) {
            throw new Error("Scheduled time is required");
          }
          result = await scheduleAsync({ postId, platforms, scheduledAt });
          toast({
            title: "Post scheduled",
            description: `Your post has been scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          });
          break;
      }

      console.log(`${mode} completed:`, result);

      // Close after a short delay to show success state
      setTimeout(() => {
        close();
      }, 1500);
      setPosting(false);
    } catch (err) {
      console.error(`${mode} failed:`, err);
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setPosting(false);
    }
  };

  return (
    <PostingModalContext.Provider value={{ open, close }}>
      {children}
      {postData && (
      <PostingModal
      visible={visible}
      onClose={close}
      postData={postData}
      brandId={brandId || ""}
      integrations={integrations}
      onPost={handlePost}
      posting={posting}
      errors={{
        publish: publishError,
        draft: draftError,
        schedule: scheduleError,
        updatePost: updatePostError,
      }}
      />
      )}
    </PostingModalContext.Provider>
  );
};

export const usePostingModal = () => {
  const ctx = useContext(PostingModalContext);
  if (!ctx) throw new Error("usePostingModal must be used within a PostingModalProvider");
  return ctx;
};

export default PostingModalProvider;
