// src/ui/layout/SidebarLeft.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/shared/ui/shadcn/sidebar';
import NewThreadButton from '@/ui/threads/NewThreadButton';
import ThreadsList from '@/ui/threads/ThreadsList';
import { WorkspaceSwitcher } from '@/ui/workspaces/WorkspaceSwitcher';
import SidebarUserHeader from './SidebarUserHeader';

import { ComponentProps } from 'react';

export default function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="left" className="ss-sidebar__left border-r" {...props}>
      <SidebarUserHeader />
      <WorkspaceSwitcher />

      <SidebarContent className="px-0 py-0 overflow-auto h-full">
        <ThreadsList />
      </SidebarContent>

      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0">
        <NewThreadButton />
      </SidebarFooter>
    </Sidebar>
  );
}
