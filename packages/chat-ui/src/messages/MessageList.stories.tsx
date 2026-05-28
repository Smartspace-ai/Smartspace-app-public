import type { Meta, StoryObj } from '@storybook/react';

import { MessageList } from './MessageList';

const meta: Meta<typeof MessageList> = {
  title: 'Messages/MessageList',
  component: MessageList,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageList>;

/** Empty state — no messages yet (stubService returns []). */
export const Empty: Story = {
  args: {},
};

/** Choosing-thread skeleton — shown briefly during workspace → thread redirect. */
export const ChoosingThread: Story = {
  args: { isChoosingThread: true },
};

/** Expanded layout — used when a sidebar panel is open beside the chat column. */
export const ExpandedLayout: Story = {
  args: { expandedLayout: true },
};
