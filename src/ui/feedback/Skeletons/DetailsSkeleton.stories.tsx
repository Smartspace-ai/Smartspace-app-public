import type { Meta, StoryObj } from '@storybook/react';

import { DetailsSkeleton } from './DetailsSkeleton';

const meta: Meta<typeof DetailsSkeleton> = {
  title: 'App/Feedback/DetailsSkeleton',
  component: DetailsSkeleton,
  parameters: { layout: 'padded' },
};

export default meta;

export const Default: StoryObj<typeof DetailsSkeleton> = {};
