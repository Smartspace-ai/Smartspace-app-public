import type { Meta, StoryObj } from '@storybook/react';

import { DetailsSkeleton } from './DetailsSkeleton';
import { ListSkeleton } from './ListSkeleton';
import { PageSkeleton } from './PageSkeleton';
import { TableSkeleton } from './TableSkeleton';

// ─── ListSkeleton ────────────────────────────────────────────────────────────

const listMeta: Meta<typeof ListSkeleton> = {
  title: 'App/Feedback/ListSkeleton',
  component: ListSkeleton,
  parameters: { layout: 'padded' },
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

// ─── DetailsSkeleton ─────────────────────────────────────────────────────────

export const Details: StoryObj<typeof DetailsSkeleton> = {
  render: () => <DetailsSkeleton />,
};

// ─── TableSkeleton ───────────────────────────────────────────────────────────

export const Table: StoryObj<typeof TableSkeleton> = {
  render: () => <TableSkeleton />,
};

export const WideTable: StoryObj<typeof TableSkeleton> = {
  render: () => <TableSkeleton columns={6} rows={8} />,
};

// ─── PageSkeleton ─────────────────────────────────────────────────────────────

export const FullPage: StoryObj<typeof PageSkeleton> = {
  parameters: { layout: 'fullscreen' },
  render: () => <PageSkeleton />,
};
