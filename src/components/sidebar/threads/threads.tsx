import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import {
  Check,
  ChevronDown,
  Edit,
  Filter,
  MoreHorizontal,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSmartSpaceChat } from '../../../contexts/smartspace-context';
import { getInitials } from '../../../utils/initials';
import { getInitialsBackground } from '../../../utils/initials-background';
import { Button } from '../../ui/button';
import { SidebarGroupLabel } from '../../ui/sidebar';

const threads: ThreadItemProps[] = [
  {
    id: '1',
    title: 'What hammers have you used?',
    replies: 2,
    lastActivity: '1 month ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '2',
    title: 'Best practices for React hooks',
    replies: 15,
    lastActivity: '2 weeks ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '3',
    title: 'Tailwind vs. CSS-in-JS',
    replies: 8,
    lastActivity: '3 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '4',
    title: 'GraphQL or REST for new projects',
    replies: 23,
    lastActivity: '1 week ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '5',
    title: 'Favorite state management library',
    replies: 31,
    lastActivity: '4 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '6',
    title: 'Docker vs Kubernetes for small te',
    replies: 12,
    lastActivity: '2 months ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '7',
    title: 'Best practices for API security',
    replies: 19,
    lastActivity: '3 weeks ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '8',
    title: 'Micro-frontends: Yay or nay?',
    replies: 27,
    lastActivity: '5 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '9',
    title: 'Serverless: Experiences and pitfall',
    replies: 14,
    lastActivity: '1 month ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '10',
    title: 'TypeScript: Tips and tricks',
    replies: 42,
    lastActivity: '2 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '11',
    title: 'React Server Components: First in first sserve',
    replies: 36,
    lastActivity: '1 week ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '12',
    title: 'CI/CD pipeline optimizations',
    replies: 9,
    lastActivity: '3 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '13',
    title: 'Monorepo vs polyrepo for startup',
    replies: 18,
    lastActivity: '2 weeks ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
  {
    id: '14',
    title: 'NextJS 13 app dir: Production rea',
    replies: 29,
    lastActivity: '4 days ago',
    isFavorite: true,
    onClick: function (): void {
      throw new Error('Function not implemented.');
    },
    onMarkFavorite: function (): void {
      throw new Error('Function not implemented.');
    },
    onRename: function (): void {
      throw new Error('Function not implemented.');
    },
    onDelete: function (): void {
      throw new Error('Function not implemented.');
    },
  },
];

interface ThreadItemProps {
  id?: string;
  title: string;
  replies: number;
  lastActivity: string;
  isFavorite: boolean;
  onClick: () => void;
  onMarkFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  id,
  title,
  replies,
  lastActivity,
  isFavorite,
  onClick,
  onMarkFavorite,
  onRename,
  onDelete,
}) => {
  const { backgroundColor, textColor } = getInitialsBackground(title);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | undefined>(
    ''
  );
  const [openMenuId, setOpenMenuId] = useState<string | undefined>('');

  return (
    <div
      key={id}
      className="group relative flex items-start gap-2 rounded-md p-2 hover:bg-accent cursor-pointer"
      onMouseEnter={() => setHoveredThreadId(id)}
      onMouseLeave={() =>
        hoveredThreadId === id && openMenuId !== id
          ? setHoveredThreadId('')
          : null
      }
      onClick={onClick}
    >
      <Avatar
        style={{ backgroundColor: backgroundColor, color: textColor }}
        className={`sidebar__thread-item-avatar w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold`}
      >
        <AvatarFallback>{getInitials(title)}</AvatarFallback>
      </Avatar>

      <div className="sidebar__thread-item-content flex-grow min-w-0 overflow-hidden">
        <h3 className="sidebar__thread-item-title text-sm font-medium truncate text-gray-800">
          {title}
        </h3>

        <p className="sidebar__thread-item-meta text-xs text-gray-500">
          {replies} {replies === 1 ? 'reply' : 'replies'} · {lastActivity}
        </p>
      </div>

      <DropdownMenu
        open={openMenuId === id}
        onOpenChange={(open) => {
          if (open) {
            setOpenMenuId(id);
          } else {
            setOpenMenuId('');
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`h-7 w-7 rounded-full absolute right-3 top-1/2 -translate-y-1/2 ${
              hoveredThreadId === id || openMenuId === id
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Star className="mr-2 h-4 w-4" />
            <span>
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500 focus:text-red-500">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function Threads() {
  const [sortOrder, setSortOrder] = useState('newest');
  const { setActiveThread } = useSmartSpaceChat();

  return (
    <div className="sidebar__threads flex-grow flex flex-col min-h-0 bg-white">
      <div className="sidebar__threads-header px-4 py-2 flex justify-between items-center bg-white border-y">
        <SidebarGroupLabel className="px-0 text-sm font-medium text-foreground">
          Threads
        </SidebarGroupLabel>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-xs">Filter</span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOrder('newest')}>
              Newest first
              {sortOrder === 'newest' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
              Oldest first
              {sortOrder === 'oldest' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('mostReplies')}>
              Most replies
              {sortOrder === 'mostReplies' && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="sidebar__scroll-area flex-grow">
        <div className="sidebar__thread-list w-[300px] xxxxxxxxxxxxxxxxxxxxxxxxx ">
          {threads.map((thread, index) => (
            <ThreadItem
              key={index}
              {...thread}
              onClick={() => setActiveThread(thread)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default Threads;
