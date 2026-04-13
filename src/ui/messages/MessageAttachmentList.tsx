import { useChatContext } from '@/platform/chat';

import { FileInfo } from '@/domains/files';
import { useFileMutations } from '@/domains/files/mutations';

import { Button } from '@/shared/ui/mui-compat/button';

export const ChatMessageAttachmentList = ({ files }: { files: FileInfo[] }) => {
  const { workspaceId, threadId } = useChatContext();
  const { downloadFileMutation } = useFileMutations({ workspaceId, threadId });

  return (
    <div>
      {files.map((f) => (
        <Button key={f.id} onClick={() => downloadFileMutation.mutateAsync(f)}>
          <span>
            {f.name} {downloadFileMutation.isPending && 'Downloading...'}
          </span>
        </Button>
      ))}
    </div>
  );
};
