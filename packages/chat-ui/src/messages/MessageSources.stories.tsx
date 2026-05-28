import type { Meta, StoryObj } from '@storybook/react';

import {
  ChatMessageSources,
  type MessageResponseSource,
} from './MessageSources';
import { MessageResponseSourceType } from '../domains/messages/enums';

const meta: Meta<typeof ChatMessageSources> = {
  title: 'Messages/MessageSources',
  component: ChatMessageSources,
};

export default meta;
type Story = StoryObj<typeof ChatMessageSources>;

const fileSources: MessageResponseSource[] = [
  {
    index: 1,
    sourceType: MessageResponseSourceType.File,
    file: { id: 'file-001', name: 'Onboarding Policy v2.pdf' },
    datasetItemId: 'ds-001',
    containerItemId: null,
  },
  {
    index: 2,
    sourceType: MessageResponseSourceType.File,
    file: { id: 'file-002', name: 'SLA Agreement 2024.docx' },
    datasetItemId: 'ds-002',
    containerItemId: null,
  },
];

export const FileSources: Story = {
  args: { sources: fileSources },
};

export const UrlSources: Story = {
  args: {
    sources: [
      {
        index: 1,
        sourceType: MessageResponseSourceType.URL,
        url: 'https://docs.smartspace.ai/getting-started',
      },
      {
        index: 2,
        sourceType: MessageResponseSourceType.URL,
        url: 'https://docs.smartspace.ai/api-reference',
      },
    ],
  },
};

export const MixedSources: Story = {
  args: {
    sources: [
      ...fileSources,
      {
        index: 3,
        sourceType: MessageResponseSourceType.URL,
        url: 'https://support.smartspace.ai/article/123',
      },
    ],
  },
};
