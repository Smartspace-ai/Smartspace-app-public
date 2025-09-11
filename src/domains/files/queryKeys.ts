export const filesMutationKeys = {
  upload: ['files', 'mutate', 'upload'] as const,
  download: ['files', 'mutate', 'download'] as const,
  downloadBlob: ['files', 'mutate', 'downloadBlob'] as const,
  downloadByUri: ['files', 'mutate', 'downloadByUri'] as const,
};

export const filesQueryKeys = {
  downloadBlob: (id?: string) => ['files', 'query', 'downloadBlob', id] as const,
};


