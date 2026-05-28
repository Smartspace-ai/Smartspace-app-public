import type { Meta, StoryObj } from '@storybook/react';

import { ChatMessageCopyButton } from './MessageCopyButton';

const meta: Meta<typeof ChatMessageCopyButton> = {
  title: 'Messages/MessageCopyButton',
  component: ChatMessageCopyButton,
};

export default meta;
type Story = StoryObj<typeof ChatMessageCopyButton>;

export const Default: Story = {
  args: {
    content: [
      {
        text: 'Based on the uploaded documents, the onboarding process takes **3–5 business days** after account approval.',
      },
    ],
  },
};

export const MultiParagraph: Story = {
  args: {
    content: [
      { text: '## Summary\n\nTotal revenue: **$2.4M** (+12% YoY).' },
      { text: 'New customers: **142** accounts acquired this quarter.' },
    ],
  },
};

export const EmptyContent: Story = {
  args: { content: [] },
};
