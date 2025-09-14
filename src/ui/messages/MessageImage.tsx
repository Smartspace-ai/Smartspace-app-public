import { FC, useEffect, useMemo } from 'react';

import { useDownloadFileBlobQuery, } from '@/domains/files/mutations';
import { FileInfo } from '@/domains/files/schemas';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';

export const ChatMessageImage: FC<{image: FileInfo}> = ({image}) => {
  const { workspaceId, threadId } = useRouteIds();
  const { data:imageBlob, isPending } = useDownloadFileBlobQuery(image.id, {workspaceId, threadId});

  const objectUrl = useMemo(() => (imageBlob ? URL.createObjectURL(imageBlob) : null), [imageBlob]);
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div
      style={{
        padding: '0.5em',
        alignContent: 'center',
      }}
    >
      {!image?.id && <Skeleton className="h-10 w-10" />}
      {isPending && 'Loading...'}
      {!isPending && !imageBlob && (
        <span style={{ fontSize: '0.75em' }}>Failed to load image</span>
      )}
      {!isPending && imageBlob && (
        <img
          style={{
            maxWidth: '100%',
            maxHeight: '20em',
          }}
          alt={image.name ?? 'Image'}
          src={objectUrl || undefined}
        />
      )}
    </div>
  );
};
