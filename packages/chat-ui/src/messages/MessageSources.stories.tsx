import type { Meta, StoryObj } from '@storybook/react';


import { MessageBubble } from './MessageBubble';
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

const botBubbleArgs = {
  createdBy: 'SmartSpace',
  createdAt: new Date('2024-03-15T10:24:30'),
  type: 'OUTPUT' as const,
  content: [
    {
      text: 'Based on the uploaded documents, the onboarding process takes **3–5 business days** after account approval.',
    },
  ],
  files: [],
  userOutput: null,
  chatbotName: 'SmartSpace',
  onSubmitUserForm: undefined,
};

const WithBubbleDecorator: Story['decorators'] = [
  (Story) => (
    <div>
      <MessageBubble {...botBubbleArgs} sources={[]} />
      <Story />
    </div>
  ),
];

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

/** File sources appear below the bot response bubble. Click to download. */
export const FileSources: Story = {
  decorators: WithBubbleDecorator,
  args: { sources: fileSources },
};

/** URL sources render as external links below the bubble. */
export const UrlSources: Story = {
  decorators: WithBubbleDecorator,
  args: { sources: urlSources },
};

/** Mix of file and URL sources below the bubble. */
export const MixedSources: Story = {
  decorators: WithBubbleDecorator,
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

/** All sources filtered out — component renders nothing. */
export const NoDisplayableSources: Story = {
  decorators: WithBubbleDecorator,
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
