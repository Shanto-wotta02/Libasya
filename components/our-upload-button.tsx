'use client';

import { generateUploadButton } from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

const UploadButton = generateUploadButton<OurFileRouter>();

type UploadedImage = {
  name: string;
  url: string;
  ufsUrl: string;
};

type OurUploadButtonProps = {
  disabled?: boolean;
  onUploadBegin?: () => void;
  onUploadComplete?: (url: string, file: UploadedImage) => void;
  onUploadError?: (error: Error) => void;
};

export function OurUploadButton({
  disabled = false,
  onUploadBegin,
  onUploadComplete,
  onUploadError,
}: OurUploadButtonProps) {
  return (
    <UploadButton
      endpoint="imageUploader"
      disabled={disabled}
      appearance={{
        container: 'items-stretch',
        button:
          'h-auto w-full rounded-lg border border-dashed border-gold/35 bg-gold/10 px-3 py-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/15 data-[state=ready]:bg-gold/10 data-[state=uploading]:bg-gold/15 data-[state=readying]:bg-gold/10 data-[state=disabled]:bg-white/[0.04] data-[state=disabled]:text-white/35',
        allowedContent: 'hidden',
      }}
      content={{
        button: ({ isUploading }) =>
          isUploading ? 'Uploading image...' : 'Upload from device',
      }}
      onUploadBegin={() => {
        onUploadBegin?.();
      }}
      onClientUploadComplete={(files) => {
        const file = files[0];

        if (!file) {
          return;
        }

        onUploadComplete?.(file.ufsUrl, {
          name: file.name,
          url: file.url,
          ufsUrl: file.ufsUrl,
        });
      }}
      onUploadError={(error) => {
        onUploadError?.(error);
      }}
    />
  );
}
