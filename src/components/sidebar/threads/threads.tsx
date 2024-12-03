import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Filter,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { get } from 'http';
import { getInitials } from '../../../utils/initials';
import { getInitialsBackground } from '../../../utils/initials-background';

const threads: ThreadItemProps[] = [
  {
    title: 'What hammers have you used?',
    replies: 2,
    time: '1 month ago',
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
    title: 'Best practices for React hooks',
    replies: 15,
    time: '2 weeks ago',
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
    title: 'Tailwind vs. CSS-in-JS',
    replies: 8,
    time: '3 days ago',
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
    title: 'GraphQL or REST for new projects',
    replies: 23,
    time: '1 week ago',
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
    title: 'Favorite state management library',
    replies: 31,
    time: '4 days ago',
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
    title: 'Docker vs Kubernetes for small te',
    replies: 12,
    time: '2 months ago',
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
    title: 'Best practices for API security',
    replies: 19,
    time: '3 weeks ago',
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
    title: 'Micro-frontends: Yay or nay?',
    replies: 27,
    time: '5 days ago',
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
    title: 'Serverless: Experiences and pitfall',
    replies: 14,
    time: '1 month ago',
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
    title: 'TypeScript: Tips and tricks',
    replies: 42,
    time: '2 days ago',
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
    title: 'React Server Components: First in',
    replies: 36,
    time: '1 week ago',
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
    title: 'CI/CD pipeline optimizations',
    replies: 9,
    time: '3 days ago',
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
    title: 'Monorepo vs polyrepo for startup',
    replies: 18,
    time: '2 weeks ago',
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
    title: 'NextJS 13 app dir: Production rea',
    replies: 29,
    time: '4 days ago',
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
  title: string;
  replies: number;
  time: string;
  onClick: () => void;
  onMarkFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  title,
  replies,
  time,
  onClick,
  onMarkFavorite,
  onRename,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { backgroundColor, textColor } = getInitialsBackground(title);

  return (
    <div className="sidebar__thread-item group relative flex items-center space-x-3 py-2 px-3 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out hover:bg-purple-100">
      <div
        className="flex-grow flex items-center space-x-3 min-w-0"
        onClick={onClick}
      >
        <div
          style={{ backgroundColor: backgroundColor, color: textColor }}
          className={`sidebar__thread-item-avatar w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-transform duration-200 ease-in-out group-hover:scale-110`}
        >
          {getInitials(title)}
        </div>
        <div className="sidebar__thread-item-content flex-grow min-w-0">
          <p className="sidebar__thread-item-title text-sm font-medium truncate text-gray-800">
            {title}
          </p>
          <p className="sidebar__thread-item-meta text-xs text-gray-500">
            {replies} replies • {time}
          </p>
        </div>
      </div>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full transition-opacity duration-200 absolute right-3 top-1/2 transform -translate-y-1/2 ${
              isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onMarkFavorite}>
            <Star className="mr-2 h-4 w-4" />
            <span>Mark as favorite</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function Threads() {
  return (
    <div className="sidebar__threads flex-grow flex flex-col min-h-0 bg-white">
      <div className="sidebar__threads-header px-4 py-2 flex justify-between items-center bg-white border-y">
        <h2 className="sidebar__threads-title text-sm font-medium text-gray-600">
          Threads
        </h2>
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Most Recent</DropdownMenuItem>
            <DropdownMenuItem>Most Replies</DropdownMenuItem>
            <DropdownMenuItem>Newest</DropdownMenuItem>
            <DropdownMenuItem>Oldest</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="sidebar__scroll-area flex-grow">
        <div className="sidebar__thread-list ">
          {threads.map((thread, index) => (
            <ThreadItem key={index} {...thread} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default Threads;
