import type { Meta, StoryObj } from '@storybook/react';

import MessageComposer from './MessageComposer';

const meta: Meta<typeof MessageComposer> = {
  title: 'Messages/MessageComposer',
  component: MessageComposer,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageComposer>;

/** Standard desktop composer — constrained width, rounded input. */
export const Default: Story = {
  args: { expandedLayout: false },
};

/** Expanded layout — input stretches to 90% of the available width. */
export const ExpandedLayout: Story = {
  args: { expandedLayout: true },
};
