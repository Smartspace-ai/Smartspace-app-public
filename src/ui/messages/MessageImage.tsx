import Skeleton from '@mui/material/Skeleton';
import { FC, useEffect, useMemo } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { FileInfo } from '@/domains/files';
import { useDownloadFileBlobQuery, } from '@/domains/files/queries';



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
