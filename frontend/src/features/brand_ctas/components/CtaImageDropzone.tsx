import { UploadDropzone } from '@/components/ui/upload-dropzone'
import React, { useState } from 'react'
import { useRemoveCtaImage, useSetCtaImage } from '../hooks';
import { useUploadFiles } from '@better-upload/client';

const CtaImageDropzone = (type: {type: "create"|"update"}) => {
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [uploadingCtaId, setUploadingCtaId] = useState<string | null>(null);

  const { mutate: setCtaImage } = useSetCtaImage();
  const { mutate: removeCtaImage } = useRemoveCtaImage();

  const { control: editUploadControl } = useUploadFiles({
    route: 'ctaImage',
    onUploadComplete: ({ files }) => {
      const file = files[0];
      if (uploadingCtaId && file?.objectInfo) {
        const imageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.objectInfo.key}`;
        setCtaImage({ ctaId: uploadingCtaId, imageUrl });
        setUploadingCtaId(null);
      }
    },
  });

  // Image upload for create flow
  const { control: createUploadControl } = useUploadFiles({
    route: 'ctaImage',
    onUploadComplete: ({ files }) => {
      const file = files[0];
      if (file?.objectInfo) {
        const imageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.objectInfo.key}`;
        setPendingImageUrl(imageUrl);
      }
    },
  });


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
  )
}

export default CtaImageDropzone