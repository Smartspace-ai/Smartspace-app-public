import type { Meta, StoryObj } from '@storybook/react';

import { MessageItem } from './MessageItem';
import { MessageValueType } from '../domains/messages/enums';
import type { Message } from '../domains/messages/model';

const meta: Meta<typeof MessageItem> = {
  title: 'Messages/MessageItem',
  component: MessageItem,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MessageItem>;

const baseValue = (type: MessageValueType, text: string) => ({
  id: 'v-1',
  name: 'output',
  type,
  value: { content: [{ text }] },
  channels: { stream: 1 },
  createdAt: new Date('2024-03-15T10:00:00'),
  createdBy: type === MessageValueType.INPUT ? 'Alice Johnson' : 'SmartSpace',
});

const userMessage: Message = {
  id: 'msg-1',
  createdAt: new Date('2024-03-15T10:00:00'),
  createdBy: 'Alice Johnson',
  createdByUserId: 'user-alice',
  values: [
    baseValue(MessageValueType.INPUT, 'Can you summarise the Q3 sales report?'),
  ],
};

const botMessage: Message = {
  id: 'msg-2',
  createdAt: new Date('2024-03-15T10:00:05'),
  createdBy: 'SmartSpace',
  values: [
    baseValue(
      MessageValueType.OUTPUT,
      '## Q3 Sales Summary\n\nTotal revenue reached **$2.4M**, up 12% year-over-year.\n\n- Enterprise Licence: $912,000\n- Pro Subscription: $480,000'
    ),
  ],
};

const statusMessage: Message = {
  id: 'msg-3',
  createdAt: new Date('2024-03-15T10:00:03'),
  createdBy: 'SmartSpace',
  values: [
    {
      id: 'v-status',
      name: 'status',
      type: MessageValueType.STATUS,
      value: 'Searching knowledge base…',
      channels: {},
      createdAt: new Date('2024-03-15T10:00:03'),
      createdBy: 'SmartSpace',
    },
  ],
};

export const UserMessage: Story = {
  args: { message: userMessage },
};

export const BotResponse: Story = {
  args: { message: botMessage },
};

export const StatusMessage: Story = {
  args: { message: statusMessage },
};

/** isLive=true — trailing status node is visible (flow still running). */
export const LiveBotResponse: Story = {
  args: { message: botMessage, isLive: true },
};
