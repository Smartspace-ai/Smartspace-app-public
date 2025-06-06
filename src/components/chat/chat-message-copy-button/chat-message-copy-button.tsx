import { MessageContent } from '@/models/message';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';

interface ChatMessageCopyButtonProps {
  content: MessageContent[] | null;
}

enum CopyState {
  IDLE = 'idle',
  SUCCESS = 'success',
}

const RESET_DELAY = 1000;

export function ChatMessageCopyButton({ content }: ChatMessageCopyButtonProps) {
  const [state, setState] = useState<CopyState>(CopyState.IDLE);

  const handleCopy = async () => {
    if (!content) return;

    const textToCopy = content
      .filter((item) => !!item.text)
      .map((item) => item.text)
      .join('\n');

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setState(CopyState.SUCCESS);

      setTimeout(() => {
        setState(CopyState.IDLE);
      }, RESET_DELAY);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getIcon = () => {
    return state === CopyState.SUCCESS ? (
      <Check className="h-3.5 w-3.5 text-green-500" />
    ) : (
      <Copy className="h-3.5 w-3.5" />
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity"
      onClick={handleCopy}
      disabled={state === CopyState.SUCCESS}
    >
      {getIcon()}
    </Button>
  );
}

export default ChatMessageCopyButton;
