import type { Meta, StoryObj } from '@storybook/react';

import { ListSkeleton } from './ListSkeleton';
import { PageSkeleton } from './PageSkeleton';

const listMeta: Meta<typeof ListSkeleton> = {
  title: 'App/Feedback/ListSkeleton',
  component: ListSkeleton,
};

export default listMeta;
type ListStory = StoryObj<typeof ListSkeleton>;

export const ThreadList: ListStory = {
  args: { rowCount: 8, rowHeight: 48 },
};

export const ShortList: ListStory = {
  args: { rowCount: 3, rowHeight: 48 },
};

export const TallRows: ListStory = {
  args: { rowCount: 5, rowHeight: 72 },
};

export const FullPage: StoryObj<typeof PageSkeleton> = {
  parameters: { layout: 'fullscreen' },
  render: () => <PageSkeleton />,
};
