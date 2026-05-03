import { useChatContext } from '@/platform/chat';

import { FileInfo } from '@/domains/files';
import { useFileMutations } from '@/domains/files/mutations';

import { Button } from '@/shared/ui/mui-compat/button';

export const ChatMessageAttachmentList = ({ files }: { files: FileInfo[] }) => {
  const { workspaceId, threadId } = useChatContext();
  const { downloadFileMutation } = useFileMutations({ workspaceId, threadId });

  // Track which file (by id) is the active download so the "Downloading…"
  // hint appears only on the row the user clicked, not on every attachment.
  const downloadingId = downloadFileMutation.isPending
    ? downloadFileMutation.variables?.id
    : undefined;

  return (
    <div>
      {files.map((f) => (
        <Button key={f.id} onClick={() => downloadFileMutation.mutateAsync(f)}>
          <span>
            {f.name} {downloadingId === f.id && 'Downloading...'}
          </span>
        </Button>
      ))}
    </div>
  );
};
