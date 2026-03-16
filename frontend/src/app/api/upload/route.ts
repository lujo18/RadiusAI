import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { cloudflare } from "@better-upload/server/clients";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

function createRouter(): Router {
  console.log('Creating Better Upload Router with bucket: cta-images');
  return {
    client: cloudflare({
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    }),
    bucketName: "cta-images",
    routes: {
      ctaImage: route({
        fileTypes: ["image/*"],
        maxFileSize: 5 * 1024 * 1024,
        onBeforeUpload: ({ file }) => {
          const ext = file.name.split(".").pop();
          const key = `${uuidv4()}.${ext}`;
          console.log('Generating custom key for upload:', key);
          return {
            objectInfo: {
              key: key,
            },
          };
        },
      }),
    },
  };
}

export async function POST(request: NextRequest) {
  console.log('Upload API POST request received');
  const router = createRouter();
  const handler = toRouteHandler(router);
  return handler.POST(request);
}
