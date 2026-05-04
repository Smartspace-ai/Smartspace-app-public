import { Loader2 } from 'lucide-react';
import { FC } from 'react';

import { cn } from '@/shared/utils/utils';

interface MessageStatusProps {
  text: string;
}

export const MessageStatus: FC<MessageStatusProps> = ({ text }) => (
  <div className={cn('flex items-center gap-2 py-2 px-3')}>
    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
    <span className="text-sm italic text-muted-foreground">{text}</span>
  </div>
);
