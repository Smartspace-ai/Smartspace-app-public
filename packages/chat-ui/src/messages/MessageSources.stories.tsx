import type { Meta, StoryObj } from '@storybook/react';

import {
  ChatMessageSources,
  type MessageResponseSource,
} from './MessageSources';
import { MessageResponseSourceType } from '../domains/messages/enums';


const meta: Meta<typeof ChatMessageSources> = {
  title: 'Messages/MessageSources',
  component: ChatMessageSources,
  parameters: { layout: 'padded' },
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

const urlSources: MessageResponseSource[] = [
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
];

/** File sources — click a file name to trigger the download mutation. */
export const FileSources: Story = {
  args: { sources: fileSources },
};

/** URL sources rendered as external links. */
export const UrlSources: Story = {
  args: { sources: urlSources },
};

/** Mix of file and URL sources. */
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

/** All sources filtered out — component returns null. */
export const NoDisplayableSources: Story = {
  args: {
    sources: [
      {
        index: 1,
        sourceType: MessageResponseSourceType.File,
        file: null,
        datasetItemId: 'ds-orphan',
        containerItemId: null,
      },
    ],
  },
};
