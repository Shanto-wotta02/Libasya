import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

import { getAdminSession } from '@/lib/admin-auth';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const admin = await getAdminSession(req);

      if (!admin) {
        throw new UploadThingError('Unauthorized');
      }

      return {
        uploadedBy: admin.id,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => ({
      name: file.name,
      size: file.size,
      uploadedBy: metadata.uploadedBy,
      url: file.ufsUrl,
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
