import type { Meta, StoryObj } from '@storybook/react';

import { MessageStatus } from './MessageStatus';

const meta: Meta<typeof MessageStatus> = {
  title: 'Messages/MessageStatus',
  component: MessageStatus,
};

export default meta;
type Story = StoryObj<typeof MessageStatus>;

export const Thinking: Story = {
  args: { text: 'Thinking…' },
};

export const Searching: Story = {
  args: { text: 'Searching knowledge base…' },
};

export const LongStatus: Story = {
  args: {
    text: 'Running cognitive function: summarise_document — this may take a moment',
  },
};
