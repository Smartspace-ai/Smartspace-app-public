import { FC } from 'react';

import { UseQueryResult } from '@tanstack/react-query';
import { MessageFile } from '../../../models/message';
import { Skeleton } from '../../ui/skeleton';

interface MessageItemImageProps {
  name?: string;
  image: MessageFile;
  useMessageFile: (id: string) => {
    useMessageFileRaw: UseQueryResult<Blob, Error>;
  };
}

export const ChatMessageImage: FC<MessageItemImageProps> = (props) => {
  const { name, image, useMessageFile } = props;

  const { useMessageFileRaw } = useMessageFile(image.id);
  const { data, isPending } = useMessageFileRaw;

  return (
    <div
      style={{
        padding: '0.5em',
        alignContent: 'center',
      }}
    >
      {!image?.id && <Skeleton className="h-10 w-10" />}
      {isPending && 'Loading...'}
      {!isPending && !data && (
        <span style={{ fontSize: '0.75em' }}>Failed to load image</span>
      )}
      {!isPending && data && (
        <img
          style={{
            maxWidth: '100%',
            maxHeight: '20em',
          }}
          alt={name}
          src={URL.createObjectURL(data)}
        />
      )}
    </div>
  );
};
