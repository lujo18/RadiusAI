import { UploadDropzone } from "@/components/ui/upload-dropzone";
import React, { useState } from "react";
import { useRemoveCtaImage, useSetCtaImage } from "../hooks";
import { useUploadFiles } from "@better-upload/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Image from "next/image";

const CtaImageDropzone = ({ type, pendingImageUrl, setPendingImageUrl, cta }: { type: "create" | "update", pendingImageUrl: string|null, setPendingImageUrl: (pendingImageUrl: string | null) => void, cta?: any }) => {

  const { mutate: setCtaImage } = useSetCtaImage();
  const { mutate: removeCtaImage } = useRemoveCtaImage();

  const { control: editUploadControl } = useUploadFiles({
    route: "ctaImage",
    onUploadComplete: ({ files }) => {
      const file = files[0];
      console.log(files)
      console.log("Prom", cta.id, file?.objectInfo)
      if (cta.id && file?.objectInfo) {
        const imageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_CTA_IMAGES}/${file.objectInfo.key}`;
        console.log("CTA URL", { ctaId: cta.id, imageUrl })
        setCtaImage({ ctaId: cta.id, imageUrl });
      }
    },
  });

  // Image upload for create flow
  const { control: createUploadControl } = useUploadFiles({
    route: "ctaImage",
    onUploadComplete: ({ files }) => {
      const file = files[0];
      console.log(files)
      console.log("Prom", file?.objectInfo)
      if (file?.objectInfo) {
        const imageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_CTA_IMAGES}/${file.objectInfo.key}`;
        console.log("CTA URL", imageUrl)

        setPendingImageUrl(imageUrl);
      }
    },
  });

  if (type == "create") {
    if (pendingImageUrl) {
      return (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
            <Image
              src={pendingImageUrl}
              alt="CTA image preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingImageUrl(null)}
            className="gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </Button>
        </div>
      );
    } else {
      return (
        <UploadDropzone
          control={createUploadControl}
          accept="image/*"
          description={{
            fileTypes: "images",
            maxFileSize: "5MB",
            maxFiles: 1,
          }}
        />
      );
    }
  } else {
    if ((cta.metadata as Record<string, unknown> | null)?.cta_image) {
      return (
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
            <Image
              src={(cta.metadata as Record<string, string>).cta_image}
              alt={`${cta.label} CTA image`}
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeCtaImage({ ctaId: cta.id })}
            className="gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </Button>
        </div>
      );
    } else {
      return (
        <UploadDropzone
          control={editUploadControl}
          accept="image/*"
          description={{
            fileTypes: "images",
            maxFileSize: "5 MB",
            maxFiles: 1,
          }}
          uploadOverride={(files, opts) => {
            editUploadControl.upload(files, opts);
          }}
        />
      );
    }
  }
};

export default CtaImageDropzone;
