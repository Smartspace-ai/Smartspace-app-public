// src/ui/layout/SidebarLeft.tsx
import { ComponentProps } from 'react';

import NewThreadButton from '@/ui/threads/NewThreadButton';
import ThreadsList from '@/ui/threads/ThreadsList';
import { WorkspaceSwitcher } from '@/ui/workspaces/WorkspaceSwitcher';

import { Sidebar } from '@/shared/ui/mui-compat/sidebar';

import SidebarUserHeader, { SidebarUserMenu } from './SidebarUserHeader';

export default function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="left" className="ss-sidebar__left border-r" {...props}>
      <SidebarUserHeader />
      <WorkspaceSwitcher />

      {/* Plain div rather than `SidebarContent`: its default `p-2` is emitted
          by both stylesheets in play and beats the padding overrides here. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ThreadsList />
      </div>

      {/* Plain div for the same reason as above — `SidebarFooter`'s `gap-2`
          would creep in on top of the account row's own spacing. */}
      <div className="mt-auto sticky bottom-0 shrink-0 p-4">
        <NewThreadButton />
        <SidebarUserMenu />
      </div>
    </Sidebar>
  );
}
