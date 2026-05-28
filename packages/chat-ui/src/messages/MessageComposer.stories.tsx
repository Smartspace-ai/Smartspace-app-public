import type { Meta, StoryObj } from '@storybook/react';

import MessageComposer from './MessageComposer';

const meta: Meta<typeof MessageComposer> = {
  title: 'Messages/MessageComposer',
  component: MessageComposer,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageComposer>;

export const Default: Story = {
  args: { expandedLayout: false },
};

export const ExpandedLayout: Story = {
  args: { expandedLayout: true },
};
