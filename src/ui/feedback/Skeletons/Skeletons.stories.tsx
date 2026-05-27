import type { Meta, StoryObj } from '@storybook/react';

import { ListSkeleton } from './ListSkeleton';
import { PageSkeleton } from './PageSkeleton';

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{ width: 280, borderRight: '1px solid #e2e8f0', height: '100vh' }}
  >
    {children}
  </div>
);

const listMeta: Meta<typeof ListSkeleton> = {
  title: 'App/Feedback/ListSkeleton',
  component: ListSkeleton,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SidebarWrapper>
        <Story />
      </SidebarWrapper>
    ),
  ],
};

export default listMeta;
type ListStory = StoryObj<typeof ListSkeleton>;

/** Thread list loading state — standard 8 rows. */
export const ThreadList: ListStory = {
  args: { rowCount: 8, rowHeight: 48 },
};

/** Fewer rows — e.g. a short workspace list. */
export const ShortList: ListStory = {
  args: { rowCount: 3, rowHeight: 48 },
};

/** Taller rows — e.g. when items have subtitles. */
export const TallRows: ListStory = {
  args: { rowCount: 5, rowHeight: 72 },
};

/** Full-page loading state shown before the app shell is ready. */
export const FullPage: StoryObj<typeof PageSkeleton> = {
  parameters: { layout: 'fullscreen', decorators: [] },
  decorators: [(Story) => <Story />],
  render: () => <PageSkeleton />,
};
