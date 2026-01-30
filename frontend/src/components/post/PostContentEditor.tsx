"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PostContentEditorProps = {
  caption: string;
  hashtags: string[];
  platformCaptions?: Record<string, string>;
  onCaptionChange: (caption: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onPlatformCaptionChange: (platform: string, caption: string) => void;
  selectedPlatforms?: string[];
};

export const PostContentEditor = ({
  caption,
  hashtags,
  platformCaptions = {},
  onCaptionChange,
  onHashtagsChange,
  onPlatformCaptionChange,
  selectedPlatforms = [],
}: PostContentEditorProps) => {
  const handleHashtagStringChange = (value: string) => {
    // Convert comma/space separated string to array
    const tags = value
      .split(/[,\s]+/)
      .map(tag => tag.replace(/^#+/, '').trim())
      .filter(Boolean);
    onHashtagsChange(tags);
  };

  const hashtagString = hashtags.join(', ');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="caption">Caption</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Enter your post caption..."
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="hashtags">Hashtags</Label>
        <Input
          id="hashtags"
          value={hashtagString}
          onChange={(e) => handleHashtagStringChange(e.target.value)}
          placeholder="funny, viral, trending"
          className="mt-1"
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((hashtag) => (
            <Badge key={hashtag} variant="secondary">
              #{hashtag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Platform-specific captions */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-3">
          <Label>Platform-specific captions</Label>
          {selectedPlatforms.map((platform) => (
            <div key={platform}>
              <Label htmlFor={`caption-${platform}`} className="text-sm capitalize">
                {platform} Caption
              </Label>
              <Textarea
                id={`caption-${platform}`}
                value={platformCaptions[platform] || caption}
                onChange={(e) => onPlatformCaptionChange(platform, e.target.value)}
                placeholder={`Caption for ${platform}...`}
                rows={2}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};