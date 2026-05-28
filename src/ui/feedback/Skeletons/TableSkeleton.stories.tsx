import type { Meta, StoryObj } from '@storybook/react';

import { TableSkeleton } from './TableSkeleton';

const meta: Meta<typeof TableSkeleton> = {
  title: 'App/Feedback/TableSkeleton',
  component: TableSkeleton,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof TableSkeleton>;

export const Default: Story = {};

export const FourColumns: Story = {
  args: { columns: 4, rows: 6 },
};

export const TwoColumns: Story = {
  args: { columns: 2, rows: 10 },
};

export const Wide: Story = {
  args: { columns: 6, rows: 8 },
};
