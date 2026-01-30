"use client";

import { File } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../ui/item";
import { Post } from "@/types/types";
import { usePostingModal } from '@/components/modals/PostingModalProvider';
import { useBrandIntegrations } from '@/lib/api/hooks/useBrands';
import { Database } from '@/types/database';
import { Iphone } from "../ui/iphone";
import { PostContent } from "@/lib/parseJsonColumn.supabase";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import CarouselWithFooter from "../ui/carousel-with-footer";
import { CarouselItem } from "../ui/carousel";
import { Badge } from "../ui/badge";

type PlatformIntegration = Database["public"]["Tables"]["platform_integrations"]["Row"];

type PostItemProps = {
  postData: Post;
  /** Show action buttons (Post). Defaults to false so UI can be reused without actions */
  showActions?: boolean;
  /** Optional callback when Post is clicked */
  onPost?: (post: Post) => void;
  /** If provided and no onPost, PostItem will open global PostingModal with this brandId */
  brandId?: string;
  /** Optional integrations to pass to modal; if omitted and brandId present, will fetch integrations */
  integrations?: PlatformIntegration[];
};

export const PostItem = ({ postData, showActions = false, onPost, brandId, integrations }: PostItemProps) => {
  const postingModal = usePostingModal();
  const { data: fetchedIntegrations } = useBrandIntegrations(brandId || "");
  const content = postData.content as PostContent;
  const storageUrls = postData.storage_urls as { slides?: string[] };

  const handlePostClick = () => {
    if (onPost) return onPost(postData);
    // prefer explicit integrations prop, else use fetchedIntegrations
    const targets = integrations ?? fetchedIntegrations;
    if (brandId) {
      postingModal.open({ postData, brandId, integrations: targets });
      return;
    }
    console.warn('PostItem: no onPost or brandId provided, cannot post');
  };

  return (
    <Item variant={"outline"}>
      <ItemHeader>
        <ItemMedia variant={"icon"}>
          <File />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Post Generated</ItemTitle>
          <ItemDescription>{content.caption}</ItemDescription>
          <ItemDescription>
            <div className="flex flex-row gap-1">
              {(content.hashtags || []).map((hashtag) => (
                <Badge key={hashtag}>#{hashtag}</Badge>
              ))}
            </div>
          </ItemDescription>
        </ItemContent>
        {showActions && (
          <ItemActions>
            <Button onClick={handlePostClick}>Post</Button>
          </ItemActions>
        )}
      </ItemHeader>
      <ItemSeparator/>
      <div className="flex flex-row gap-2 w-full">
        <CarouselWithFooter>
          {storageUrls?.slides?.map((slide) => (
            <CarouselItem className="basis-1/2 md:basis-1/5" key={slide}>
              <Card className="p-0">
                <img src={slide} />
              </Card>
            </CarouselItem>
          ))}
        </CarouselWithFooter>
      </div>
    </Item>
  );
};
