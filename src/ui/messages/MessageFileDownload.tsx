import { Check, Download, Loader2, X } from 'lucide-react';

import { FileInfo } from '@/domains/files';
import { useFileMutations } from '@/domains/files/mutations';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { Button } from '@/shared/ui/mui-compat/button';

export function ChatMessageFileDownload({
  file
}: {file: FileInfo}) {
  const { workspaceId, threadId } = useRouteIds();
  const { downloadFileMutation } = useFileMutations({workspaceId, threadId});

  const getIcon = () => {
    if  (downloadFileMutation.isPending) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    } else if (downloadFileMutation.isSuccess) {
        return <Check className="h-4 w-4 text-green-500" />;
    } else if (downloadFileMutation.isError) {
        return <X className="h-4 w-4 text-red-500" />;
    } else {
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Button
      size="icon"
      aria-label="Download file"
      variant="ghost"
      className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity"
      onClick={() => downloadFileMutation.mutateAsync(file)}
      disabled={downloadFileMutation.isPending}
    >
      {getIcon()}
    </Button>
  );
}

export default ChatMessageFileDownload;
