import type { Meta, StoryObj } from '@storybook/react';

import { ChatMessageCopyButton } from './MessageCopyButton';

const meta: Meta<typeof ChatMessageCopyButton> = {
  title: 'Messages/MessageCopyButton',
  component: ChatMessageCopyButton,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ChatMessageCopyButton>;

export const Default: Story = {
  args: {
    content: [{ text: 'Here is the answer to your question.' }],
  },
};

export const MultiParagraph: Story = {
  args: {
    content: [
      { text: '## Summary\n\nThis is the first paragraph.' },
      { text: 'And this is the second paragraph.' },
    ],
  },
};

export const EmptyContent: Story = {
  args: { content: [] },
};
