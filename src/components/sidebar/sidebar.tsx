import { Plus } from 'lucide-react';
import { Logo } from '../../assets/logo';
import { Button } from '../ui/button';
import styles from './sidebar.module.scss';
import Threads from './threads/threads';
import Workspaces from './workspaces/workspaces';

export function Sidebar() {
  return (
    <div
      id="sidebar"
      className="sidebar w-[300px] h-screen flex flex-col bg-card border "
    >
      <div className="sidebar__logo-workspaces p-4">
        <div className="h-2">
          <Logo></Logo>
        </div>
        <Workspaces></Workspaces>
      </div>
      <Threads></Threads>
      <div className="sidebar__footer p-4">
        <Button className="sidebar__new-thread-button w-full">
          <Plus className="mr-2 h-4 w-4" /> New Thread
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
