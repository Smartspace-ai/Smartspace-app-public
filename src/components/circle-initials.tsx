import { Avatar } from '@/components/ui/avatar';

import { getInitials } from '../utils/initials';


export function CircleInitials({text, className}: { text: string, className?: string }) {
  return (
    <Avatar
        className={`h-8 w-8 text-[12px] shadow-sm ` + (className || 'bg-gray-300')}
    >
      <div className="text-[12px] font-medium truncate flex h-full w-full items-center justify-center rounded-full">
        {getInitials(text)}
      </div>
    </Avatar>
  );
}
