import type { Meta, StoryObj } from '@storybook/react';


import { MessageBubble } from './MessageBubble';
import { MessageStatus } from './MessageStatus';
import { MessageValueType } from '../domains/messages/enums';

const meta: Meta<typeof MessageStatus> = {
  title: 'Messages/MessageStatus',
  component: MessageStatus,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MessageStatus>;

const botBubbleArgs = {
  createdBy: 'SmartSpace',
  createdAt: new Date('2024-03-15T10:23:05'),
  type: MessageValueType.OUTPUT,
  content: [{ text: 'Let me look into that for you…' }],
  sources: [],
  files: [],
  userOutput: null,
  chatbotName: 'SmartSpace',
};

const WithBubbleDecorator: Story['decorators'] = [
  (Story) => (
    <div>
      <MessageBubble {...botBubbleArgs} onSubmitUserForm={undefined} />
      <Story />
    </div>
  ),
];

export const Thinking: Story = {
  decorators: WithBubbleDecorator,
  args: { text: 'Thinking…' },
};

export const Searching: Story = {
  decorators: WithBubbleDecorator,
  args: { text: 'Searching knowledge base…' },
};

export const LongStatus: Story = {
  decorators: WithBubbleDecorator,
  args: {
    text: 'Running cognitive function: summarise_document — this may take a moment',
  },
};
