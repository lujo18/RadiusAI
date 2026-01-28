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
import { Iphone } from "../ui/iphone";
import { PostContent } from "@/lib/parseJsonColumn.supabase";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import CarouselWithFooter from "../ui/carousel-with-footer";
import { CarouselItem } from "../ui/carousel";
import { Badge } from "../ui/badge";

type PostItemProps = {
  postData: Post;
};

export const PostItem = ({ postData }: PostItemProps) => {
  const content = postData.content as PostContent;
  const storageUrls = postData.storage_urls as { slides?: string[] };

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
              {content.hashtags.map((hashtag) => (
                <Badge key={hashtag}>#{hashtag}</Badge>
              ))}
            </div>
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button>Post</Button>
        </ItemActions>
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
