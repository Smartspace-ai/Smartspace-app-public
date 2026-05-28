import type { Meta, StoryObj } from '@storybook/react';

import { MessageListSkeleton } from './MessageList.skeleton';

const meta: Meta<typeof MessageListSkeleton> = {
  title: 'Messages/MessageListSkeleton',
  component: MessageListSkeleton,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageListSkeleton>;

export const Default: Story = {};
