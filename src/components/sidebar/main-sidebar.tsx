import { Plus } from 'lucide-react';
import { Logo } from '../../assets/logo';
import { Button } from '../ui/button';
import styles from './sidebar.module.scss';
import Threads from './threads/threads';
import Workspaces from './workspaces/workspaces';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '../ui/sidebar';

export function MainSidebar() {
  return (
    <Sidebar>
      <div
        id="sidebar"
        className="sidebar h-screen flex flex-col bg-card border "
      >
        <SidebarHeader>
          <div className="sidebar__logo-workspaces p-4">
            <Logo></Logo>
            <Workspaces></Workspaces>
          </div>
        </SidebarHeader>
        <Threads></Threads>
        <SidebarFooter>
          <div className="sidebar__footer p-4">
            <Button className="sidebar__new-thread-button w-full">
              <Plus className="mr-2 h-4 w-4" /> New Thread
            </Button>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default MainSidebar;
