import { Avatar, AvatarFallback } from '@/shared/ui/mui-compat/avatar';

import { getInitials } from '../utils/initials';


export function CircleInitials({text, className, colored = false}: { text: string, className?: string, colored?: boolean }) {
  return (
    <Avatar
        className={`h-8 w-8 text-[12px] shadow-sm ${className || ''}`}
    >
      <AvatarFallback className="text-[12px] font-medium truncate" colored={colored}>
        {getInitials(text)}
      </AvatarFallback>
    </Avatar>
  );
}
