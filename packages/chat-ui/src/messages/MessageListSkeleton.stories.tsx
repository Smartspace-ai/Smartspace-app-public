import type { Meta, StoryObj } from '@storybook/react';

import { MessageListSkeleton } from './MessageList.skeleton';

const meta: Meta<typeof MessageListSkeleton> = {
  title: 'Messages/MessageListSkeleton',
  component: MessageListSkeleton,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageListSkeleton>;

/** Loading state shown while the message list fetches — fills the chat panel. */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
