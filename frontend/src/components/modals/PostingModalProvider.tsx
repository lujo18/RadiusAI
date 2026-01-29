"use client";

import React, { createContext, useContext, useState } from "react";
import PostingModal from "./PostingModal";
import { Database } from "@/types/database";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];
type PostPayload = any;

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
  };

  const handlePost = async (integrationIds: string[]) => {
    try {
      setPosting(true);
      // Default behavior: just log. Consumers can override by calling open then handling their own post action.
      console.log("Posting to integrations:", integrationIds, postData);
      // Close after posting
      setVisible(false);
    } finally {
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
