import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ChatProvider, type ChatService } from '@smartspace/chat-ui';

import '@smartspace/chat-ui/styles.css';
import '../src/styles.scss';

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

/**
 * Global shell — wraps every story in a realistic chat-column container.
 *
 * Non-fullscreen stories: centred, max 760px wide, with the same soft
 * background gradient the real chat column uses.
 *
 * Fullscreen stories (PageSkeleton, MessageComposer etc.) set
 * `parameters: { layout: 'fullscreen' }` and get a full-viewport container.
 */
function ChatShell({
  children,
  fullscreen,
}: {
  children: React.ReactNode;
  fullscreen: boolean;
}) {
  if (fullscreen) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-background from-10% via-muted/20 to-muted/40 text-foreground flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background from-10% via-muted/20 to-muted/40 text-foreground py-8">
      <div className="max-w-[760px] mx-auto px-6">{children}</div>
    </div>
  );
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const fullscreen = context.parameters?.layout === 'fullscreen';
      return (
        <QueryClientProvider client={queryClient}>
          <ChatProvider
            service={stubService}
            workspaceId="story-workspace"
            threadId="story-thread"
            identity={{ userId: 'story-user', displayName: 'Story User' }}
          >
            <ChatShell fullscreen={fullscreen}>
              <Story />
            </ChatShell>
          </ChatProvider>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
