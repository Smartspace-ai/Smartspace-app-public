import { Bell, User, MessageSquare, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { SidebarTrigger } from '../../ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../ui/breadcrumb';

export function ChatHeader() {
  return (
    <div className="chat__header">
      <div className="flex p-4 bg-card border-y justify-between gap-4">
        <div className="flex gap-2 shrink-0 items-center ">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Year 1</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage> Do we have any sales data?</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* <div className="chat__header_title">
            <h1 className="text-xl font-bold text-gray-800">Year 1</h1>
            <h2 className="text-sm text-gray-600">
              Do we have any sales data?
            </h2>
          </div> */}
        </div>

        <div className="chat__header_actions flex gap-2">
          <Button
            className="rounded-full hover:border hover:bg-white"
            variant="ghost"
            size="icon"
          >
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-full hover:border hover:bg-white"
                variant="ghost"
                size="icon"
              >
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <div className="flex gap-1 items-center">
                <Avatar className="my-3 mx-2 h-10 w-10 rounded-full bg-slate-400 flex items-center justify-center">
                  <AvatarImage className="rounded-full" alt="@shadcn" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    John Doe
                  </span>
                  <span className="text-xs text-gray-600">
                    john.doe@smartspace.ai
                  </span>
                </div>
              </div>
              <Separator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="rounded-full hover:border hover:bg-white"
            variant="ghost"
            size="icon"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
