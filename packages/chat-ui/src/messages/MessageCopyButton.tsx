import { Check, Copy } from 'lucide-react';
import { RefObject, useState } from 'react';

import { MessageContentItem } from '@/domains/messages';

import { copyText } from '@/shared/markdown/htmlPreviewShared';
import { Button } from '@/shared/mui-compat/button';

import { copyMessageRich } from './smartCopy';

enum CopyState {
  IDLE = 'idle',
  SUCCESS = 'success',
}

const RESET_DELAY = 1000;

export function ChatMessageCopyButton({
  content,
  contentRef,
}: {
  content: MessageContentItem[];
  /** Live rendered message element — its chart iframes are rasterized so the
   *  copy pastes into Word as images. Falls back to plain text when absent. */
  contentRef?: RefObject<HTMLElement | null>;
}) {
  const [state, setState] = useState<CopyState>(CopyState.IDLE);

  const handleCopy = async () => {
    if (!content) return;

    const textToCopy = content
      .filter((item) => !!item.text)
      .map((item) => item.text)
      .join('\n');

    if (!textToCopy) return;

    const container = contentRef?.current;
    const ok = container
      ? await copyMessageRich(container, textToCopy)
      : await copyText(textToCopy);

    if (ok) {
      setState(CopyState.SUCCESS);
      setTimeout(() => {
        setState(CopyState.IDLE);
      }, RESET_DELAY);
    } else {
      console.error('Failed to copy message content');
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
      aria-label="Copy message content"
      className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity"
      onClick={handleCopy}
      disabled={state === CopyState.SUCCESS}
    >
      {getIcon()}
    </Button>
  );
}

export default ChatMessageCopyButton;
