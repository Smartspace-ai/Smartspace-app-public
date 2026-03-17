export const filesKeys = {
  all: ['files'] as const,

  queries: () => [...filesKeys.all, 'query'] as const,
  downloadBlob: (fileId: string) => [...filesKeys.queries(), 'downloadBlob', { fileId }] as const,

  mutations: () => [...filesKeys.all, 'mutation'] as const,
  mutation: {
    upload: (scope?: { workspaceId?: string; threadId?: string }) => [...filesKeys.mutations(), 'upload', { scope }] as const,
    download: (fileId: string) => [...filesKeys.mutations(), 'download', { fileId }] as const,
    downloadBlob: (fileId: string) => [...filesKeys.mutations(), 'downloadBlob', { fileId }] as const,
    downloadByUri: (uri: string) => [...filesKeys.mutations(), 'downloadByUri', { uri }] as const,
  },
};


