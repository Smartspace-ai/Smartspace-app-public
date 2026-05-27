import Skeleton from '@mui/material/Skeleton';
import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown } from 'lucide-react';

import { ListSkeleton } from './ListSkeleton';
import { PageSkeleton } from './PageSkeleton';

/**
 * Mirrors the real SidebarLeft layout: user header → workspace switcher →
 * separator → "Threads" label → separator → scrollable thread list → footer.
 * Uses static placeholders for the parts that need live query data.
 */
const SidebarShell = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 280,
      height: '100vh',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--sidebar, #f8fafc)',
    }}
  >
    {/* User header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="text" width={120} />
    </div>

    {/* Workspace switcher */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid #e2e8f0',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="text" width={110} />
      </div>
      <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
    </div>

    {/* "Threads" section label */}
    <div style={{ padding: '10px 20px 6px' }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Threads
      </span>
    </div>
    <div style={{ height: 1, background: '#e2e8f0', marginBottom: 0 }} />

    {/* Scrollable thread list */}
    <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>

    {/* New Thread button footer */}
    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
      <Skeleton variant="rectangular" height={36} style={{ borderRadius: 6 }} />
    </div>
  </div>
);

const listMeta: Meta<typeof ListSkeleton> = {
  title: 'App/Feedback/ListSkeleton',
  component: ListSkeleton,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SidebarShell>
        <Story />
      </SidebarShell>
    ),
  ],
};

export default listMeta;
type ListStory = StoryObj<typeof ListSkeleton>;

/** Thread list loading state — standard 8 rows inside the full sidebar shell. */
export const ThreadList: ListStory = {
  args: { rowCount: 8, rowHeight: 48 },
};

/** Fewer threads — e.g. a workspace with a short history. */
export const ShortList: ListStory = {
  args: { rowCount: 3, rowHeight: 48 },
};

/** Taller rows — e.g. when thread items include a subtitle or timestamp. */
export const TallRows: ListStory = {
  args: { rowCount: 5, rowHeight: 72 },
};

/** Full-page loading state shown before the app shell is ready. */
export const FullPage: StoryObj<typeof PageSkeleton> = {
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <Story />],
  render: () => <PageSkeleton />,
};
