import type { Meta, StoryObj } from '@storybook/react';

import { MessageBubble } from './MessageBubble';
import {
  MessageResponseSourceType,
  MessageValueType,
} from '../domains/messages/enums';

const meta: Meta<typeof MessageBubble> = {
  title: 'Messages/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'padded',
  },
  args: {
    onSubmitUserForm: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

/** A plain user message — INPUT type with text content and no attachments. */
export const UserMessage: Story = {
  args: {
    createdBy: 'Alice Johnson',
    createdAt: new Date('2024-03-15T10:23:00'),
    type: MessageValueType.INPUT,
    content: [{ text: 'Can you summarise the Q3 sales report for me?' }],
    sources: [],
    files: [],
    userOutput: null,
    createdByUserId: 'user-alice-123',
    chatbotName: 'SmartSpace',
  },
};

/** A bot response — OUTPUT type with markdown text content. */
export const BotResponse: Story = {
  args: {
    createdBy: 'SmartSpace',
    createdAt: new Date('2024-03-15T10:23:05'),
    type: MessageValueType.OUTPUT,
    content: [
      {
        text: [
          '## Q3 Sales Summary',
          '',
          'Here are the key highlights from the Q3 sales report:',
          '',
          '- **Total revenue**: $2.4M (+12% YoY)',
          '- **New customers**: 142 accounts acquired',
          '- **Top product**: Enterprise licence (38% of total)',
          '',
          'Overall Q3 performance exceeded the forecast by **7%**.',
        ].join('\n'),
      },
    ],
    sources: [],
    files: [],
    userOutput: null,
    chatbotName: 'SmartSpace',
  },
};

/**
 * A bot response with document and web sources listed below the message.
 * The Sources panel is collapsed by default — click the header to expand it.
 */
export const BotResponseWithSources: Story = {
  args: {
    createdBy: 'SmartSpace',
    createdAt: new Date('2024-03-15T10:24:30'),
    type: MessageValueType.OUTPUT,
    content: [
      {
        text: [
          'Based on the uploaded documents and our knowledge base:',
          '',
          'The onboarding process takes **3–5 business days** after account',
          'approval. See the referenced sources for the full policy details.',
        ].join('\n'),
      },
    ],
    sources: [
      {
        index: 1,
        sourceType: MessageResponseSourceType.File,
        file: { id: 'file-001', name: 'Onboarding Policy v2.pdf' },
        datasetItemId: 'ds-item-001',
        containerItemId: null,
      },
      {
        index: 2,
        sourceType: MessageResponseSourceType.URL,
        url: 'https://docs.smartspace.ai/onboarding',
      },
      {
        index: 3,
        sourceType: MessageResponseSourceType.File,
        file: { id: 'file-002', name: 'SLA Agreement 2024.docx' },
        datasetItemId: 'ds-item-002',
        containerItemId: null,
      },
    ],
    files: [],
    userOutput: null,
    chatbotName: 'SmartSpace',
  },
};

/** A user message that includes a file attachment alongside the text. */
export const UserMessageWithFile: Story = {
  args: {
    createdBy: 'Bob Smith',
    createdAt: new Date('2024-03-15T11:05:00'),
    type: MessageValueType.INPUT,
    content: [
      {
        text: 'Please review the attached contract draft and flag any issues.',
      },
    ],
    sources: [],
    files: [
      { id: 'upload-abc', name: 'Contract_Draft_v3.pdf' },
      { id: 'upload-def', name: 'Appendix_A.xlsx' },
    ],
    userOutput: null,
    createdByUserId: 'user-bob-456',
    chatbotName: 'SmartSpace',
  },
};
