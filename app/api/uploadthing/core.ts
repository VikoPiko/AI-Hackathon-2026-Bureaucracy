import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { z } from 'zod';
import { ingestLogger } from '@/lib/logger';

const f = createUploadthing();

async function triggerIngest(fileUrl: string, country: string, fileKey: string): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const payload = {
    file_url: fileUrl,
    metadata: {
      country,
      category: 'user_upload',
      source_url: fileUrl,
      language: 'en',
      procedure_id: `upload-${fileKey}`,
    },
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${appUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Ingest request failed with status ${res.status}`);
      }

      ingestLogger.info('UploadThing ingest trigger succeeded', {
        file_key: fileKey,
        attempt: attempt + 1,
      });
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  ingestLogger.error('UploadThing ingest trigger failed', {
    file_key: fileKey,
    message: lastError?.message || 'Unknown error',
  });
}

/**
 * UploadThing router for document uploads
 * Handles both document analysis and knowledge base ingestion
 */
export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      maxFileSize: '8MB', maxFileCount: 1,
    },
  })
    .input(z.object({
      country: z.string().default('DE'),
      mode: z.enum(['analyze', 'ingest']).default('analyze'),
      document_type: z.string().default('contract'),
    }))
    .middleware(async ({ input }) => ({ meta: input }))
    .onUploadComplete(async ({ file, metadata }) => {
      if (metadata.meta.mode === 'ingest') {
        await triggerIngest(file.url, metadata.meta.country, file.key);
      }
      return {
        url: file.url,
        mode: metadata.meta.mode,
        document_type: metadata.meta.document_type,
        country: metadata.meta.country,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
