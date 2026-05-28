import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextLine: Story = {
  args: { style: { width: '60%', height: 16 } },
};

export const Avatar: Story = {
  args: { style: { width: 40, height: 40, borderRadius: '50%' } },
};

export const Card: Story = {
  args: { style: { width: '100%', height: 120 } },
};

export const MessageRow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton style={{ width: '75%', height: 16 }} />
      <Skeleton style={{ width: '55%', height: 16 }} />
      <Skeleton style={{ width: '65%', height: 16 }} />
    </div>
  ),
};
