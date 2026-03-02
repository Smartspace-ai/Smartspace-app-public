import { z } from 'zod';

export const FileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const FileScopeSchema = z.object({
  workspaceId: z.string().optional(),
  threadId: z.string().optional(),
});

// Type exports for TypeScript
export type FileInfo = z.infer<typeof FileInfoSchema>;
export type FileScope = z.infer<typeof FileScopeSchema>;
