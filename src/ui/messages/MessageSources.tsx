
import { useFileMutations } from '@/domains/files/useFiles';
import { MessageResponseSourceType } from '@/domains/messages/enums';
import { MessageResponseSource } from '@/domains/messages/schemas';
import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';


export function ChatMessageSources({
  source
}: {source: MessageResponseSource}) {
  const { workspaceId, threadId } = useRouteIds();
  const { downloadFileByUriMutation } = useFileMutations({workspaceId, threadId});

  const handleDownload = (source: MessageResponseSource) => {
    if (
      source.sourceType === MessageResponseSourceType.BlobInternal &&
      !downloadFileByUriMutation.isPending
    ) {
      if (source.name) {
        downloadFileByUriMutation.mutate({
          name: source.name,
          sourceUri: source.uri,
        });
      }
    }
  };

  return (
    <li className={'ss-messages__message-item--sources-source'}>
      <span>{`(${source.index})`} : </span>
      {source.sourceType === MessageResponseSourceType.BlobInternal ? (
        <button
          type="button"
          title={source.name || source.uri}
          onClick={() => {
            handleDownload(source);
          }}
          className={'source-link'}
          disabled={downloadFileByUriMutation.isPending}
        >
          {source.name || source.uri}
        </button>
      ) : (
        <a
          className={'source-link'}
          title={source.name || source.uri}
          href={source.uri}
          target="_blank"
          rel="noreferrer"
        >
          {source.name || source.uri}
        </a>
      )}
      {downloadFileByUriMutation.isPending && 'Downloading...'}
    </li>
  );
}
