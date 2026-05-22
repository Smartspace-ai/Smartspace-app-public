import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ChatProvider, type ChatService } from '@smartspace/chat-ui';

import '@smartspace/chat-ui/styles.css';

/**
 * Minimal stub ChatService — returns empty/inert data for every call.
 * Stories that need real service behaviour should override via decorators.
 */
const stubService: ChatService = {
  fetchMessages: async () => [],
  sendMessage: async () => {
    throw new Error('stubService.sendMessage not implemented in Storybook');
  },
  addInputToMessage: async () => {
    throw new Error(
      'stubService.addInputToMessage not implemented in Storybook'
    );
  },
  uploadFiles: async () => [],
  downloadFile: async () => new Blob(),
  getFileInfo: async () => ({ id: '', name: '' }),
  getFileDownloadUrl: async () => '',
  fetchThread: async () => ({
    id: 'story-thread',
    createdAt: new Date('2024-01-01'),
    createdBy: 'Story User',
    createdByUserId: 'story-user',
    isFlowRunning: false,
    lastUpdatedAt: new Date('2024-01-01'),
    lastUpdatedByUserId: 'story-user',
    name: 'Story Thread',
    totalMessages: 0,
    pinned: false,
    workSpaceId: 'story-workspace',
    summaryEmittedAt: Date.now(),
  }),
  fetchWorkspace: async () => ({
    id: 'story-workspace',
    name: 'Story Workspace',
    tags: [],
    showSources: false,
    dataSpaces: [],
    favorited: false,
    summary: '',
    firstPrompt: '',
    variables: {},
    supportsFiles: false,
    avatarName: 'SW',
  }),
  fetchTaggableUsers: async () => [],
  fetchFlowRunVariables: async () => ({}),
  updateFlowRunVariable: async () => undefined,
  fetchModels: async () => ({ data: [], total: 0 }),
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ChatProvider
          service={stubService}
          workspaceId="story-workspace"
          threadId="story-thread"
          identity={{ userId: 'story-user', displayName: 'Story User' }}
        >
          <Story />
        </ChatProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
};

export default preview;
