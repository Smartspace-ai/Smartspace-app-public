import { Button } from '@/components/ui/button';
import { MessageFile } from '@/models/message';
import { Check, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageFileDownloadProps {
  file: MessageFile;
  downloadFile: (id: string) => Promise<Blob>;
  saveFile: (blob: Blob, fileName: string) => void;
}

enum DownloadState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
}

const RESET_DELAY = 1000;

export function ChatMessageFileDownload({
  file,
  downloadFile,
  saveFile,
}: ChatMessageFileDownloadProps) {
  const [state, setState] = useState<DownloadState>(DownloadState.IDLE);

  const handleDownload = async () => {
    setState(DownloadState.LOADING);
    try {
      const blob = await downloadFile(file.id);
      saveFile(blob, file.name || 'download');
      setState(DownloadState.SUCCESS);

      // Reset to Download icon after a delay
      setTimeout(() => {
        setState(DownloadState.IDLE);
      }, RESET_DELAY);
    } catch (error) {
      console.error(`Failed to download file: ${file.name}`, error);
      setState(DownloadState.IDLE);
    }
  };

  const getIcon = () => {
    switch (state) {
      case DownloadState.LOADING:
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case DownloadState.SUCCESS:
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity"
      onClick={handleDownload}
      disabled={state === DownloadState.LOADING}
    >
      {getIcon()}
    </Button>
  );
}

export default ChatMessageFileDownload;
