// src/ui/layout/SidebarLeft.tsx
import { ComponentProps } from 'react';

import NewThreadButton from '@/ui/threads/NewThreadButton';
import ThreadsList from '@/ui/threads/ThreadsList';
import { WorkspaceSwitcher } from '@/ui/workspaces/WorkspaceSwitcher';

import { Sidebar } from '@/shared/ui/mui-compat/sidebar';

import SidebarUserHeader from './SidebarUserHeader';

export default function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  return (
    // `chat-sidebar` owns the rail's whole look: it is always the dark navy
    // surface with the ambient glow and grid texture, independent of the active
    // light/dark theme, and it re-points the shadcn tokens for its subtree.
    //
    // `border-border` is load-bearing. A bare `border-r` falls back to
    // Tailwind's default grey, which drew a light hairline down the dark rail in
    // both themes; naming the token picks up the rail's own dark `--border`.
    <Sidebar
      side="left"
      className="ss-sidebar__left chat-sidebar border-r border-border"
      {...props}
    >
      <SidebarUserHeader />
      <WorkspaceSwitcher />

      {/* Plain divs rather than `SidebarContent` / `SidebarFooter`: their
          default `p-2` / `gap-2` are emitted by both stylesheets in play and
          beat the padding passed via `className`. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ThreadsList />
      </div>

      <div className="shrink-0 p-4">
        <NewThreadButton />
      </div>
    </Sidebar>
  );
}
