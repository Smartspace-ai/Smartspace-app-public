// src/ui/layout/SidebarLeft.tsx
import { ComponentProps } from 'react';

import NewThreadButton from '@/ui/threads/NewThreadButton';
import ThreadsList from '@/ui/threads/ThreadsList';
import { WorkspaceSwitcher } from '@/ui/workspaces/WorkspaceSwitcher';

import { Separator } from '@/shared/ui/mui-compat/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/shared/ui/mui-compat/sidebar';

import SidebarUserHeader from './SidebarUserHeader';


export default function SidebarLeft(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="left" className="ss-sidebar__left border-r" {...props}>
      <SidebarUserHeader />
      <WorkspaceSwitcher />

      <Separator className="opacity-40" />
      <div className="px-3 py-3">
        <div className="text-xs font-semibold tracking-wide text-gray-500 px-1">
          Threads
        </div>
      </div>
      <Separator className="opacity-40" />

      <SidebarContent className="px-0 py-0 overflow-auto h-full">
        <ThreadsList />
      </SidebarContent>

      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0">
        <NewThreadButton />
      </SidebarFooter>
    </Sidebar>
  );
}
