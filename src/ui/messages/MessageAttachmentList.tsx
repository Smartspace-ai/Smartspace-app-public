import { useFileMutations } from '@/domains/files/mutations';
import { FileInfo } from '@/domains/files/schemas';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { Button } from '@/shared/ui/shadcn/button';


export const ChatMessageAttachmentList = ({
  files,
}:{files: FileInfo[]}) => {
  const { workspaceId, threadId } = useRouteIds();
  const { downloadFileMutation } = useFileMutations({workspaceId, threadId});

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
