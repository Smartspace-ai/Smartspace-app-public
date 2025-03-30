import { UseMutationResult } from '@tanstack/react-query';
import { MessageResponseSourceType } from '../../../enums/message-response-source-type';
import { MessageResponseSource } from '../../../models/message-response-source';
import styles from './chat-message-sources.module.scss';

export interface ChatMessageSourceProps {
  source: MessageResponseSource;
  useQueryFiles: () => {
    downloadFileMutation: UseMutationResult<
      void,
      Error,
      { name: string; sourceUri: string },
      unknown
    >;
  };
}

export function ChatMessageSources({
  source,
  useQueryFiles,
}: ChatMessageSourceProps) {
  const { downloadFileMutation } = useQueryFiles();

  const handleDownload = (source: MessageResponseSource) => {
    if (
      source.sourceType === MessageResponseSourceType.BlobInternal &&
      !downloadFileMutation.isPending
    ) {
      if (source.name) {
        downloadFileMutation.mutate({
          name: source.name,
          sourceUri: source.uri,
        });
      }
    }
  };

  return (
    <li className={styles['ss-messages__message-item--sources-source']}>
      <span>{`(${source.index})`} : </span>
      {source.sourceType === MessageResponseSourceType.BlobInternal ? (
        <span
          onClick={(e) => {
            handleDownload(source);
          }}
          className={styles['source-link']}
        >
          {source.name || source.uri}
        </span>
      ) : (
        <a
          className={styles['source-link']}
          title={source.name || source.uri}
          href={source.uri}
          target="_blank"
          rel="noreferrer"
        >
          {source.name || source.uri}
        </a>
      )}
      {downloadFileMutation.isPending && 'Downloading...'}
    </li>
  );
}
