"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";

export default function CarouselWithFooter({
  children,
  externalCurrent,
  setExternalCurrent,
  ...props
}: {
  children: React.ReactNode;
  externalCurrent?: number;
  setExternalCurrent?: (index: number) => void;
  [key: string]: any;
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    if (typeof externalCurrent === "number") {
      api?.scrollTo(externalCurrent);
    }
  }, [externalCurrent]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    if (setExternalCurrent) {
      setExternalCurrent(api.selectedScrollSnap());
    }

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Carousel setApi={setApi} className="w-full" {...props}>
        <CarouselContent className="p-1">{children}</CarouselContent>
        <CarouselPrevious className="absolute top-[calc(100%+0.5rem)] left-0 translate-y-0" />
        <CarouselNext className="absolute top-[calc(100%+0.5rem)] left-2 translate-x-full translate-y-0" />
      </Carousel>

      {count > 0 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              className={cn("h-3.5 w-3.5 rounded-full border-2", {
                "border-primary": current === index + 1,
              })}
              key={index}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
