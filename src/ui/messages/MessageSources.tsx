import {
  ChevronUp,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { useFileMutations } from '@/domains/files/mutations';
import { MessageResponseSourceType } from '@/domains/messages/enums';
// Keeping this component generic; adjust type if needed in the future

import { cn } from '@/shared/utils/utils';

export type MessageResponseSource = {
  index: number;
  datasetItemId?: string;
  containerItemId?: string | null;
  flowRunId?: string;
  file?: { id: string; name: string } | null;
  url?: string | null;
  sourceType: MessageResponseSourceType;
};

// Utility function to get file type icon (mirrors Spencers-Ui behavior)
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Image files
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(
      extension || ''
    )
  ) {
    return FileImage;
  }

  // Video files
  if (
    ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')
  ) {
    return FileVideo;
  }

  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension || '')) {
    return FileAudio;
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
    return FileArchive;
  }

  // Code files
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'py',
      'java',
      'cpp',
      'c',
      'cs',
      'php',
      'html',
      'css',
      'json',
      'xml',
      'md',
    ].includes(extension || '')
  ) {
    return FileCode;
  }

  // Spreadsheet files
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
    return FileSpreadsheet;
  }

  // Presentation files
  if (['pptx', 'ppt'].includes(extension || '')) {
    return Presentation;
  }

  // Default document icon
  return FileText;
};

function getDisplayName(source: MessageResponseSource): string {
  if (source.file?.name) return source.file.name;
  if (source.url) {
    try {
      const parsed = new URL(source.url);
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
      return source.url;
    }
  }
  return `Source ${source.index}`;
}

function isFileSource(
  s: MessageResponseSource
): s is MessageResponseSource & { file: { id: string; name: string } } {
  return s.sourceType === MessageResponseSourceType.File && !!s.file;
}

function isLinkSource(s: MessageResponseSource): boolean {
  return (
    (s.sourceType === MessageResponseSourceType.URL ||
      s.sourceType === MessageResponseSourceType.WebExternal) &&
    !!s.url
  );
}

export function ChatMessageSources({
  sources,
}: {
  sources: MessageResponseSource[];
}) {
  const { workspaceId, threadId } = useRouteIds();
  const { downloadFileMutation } = useFileMutations({ workspaceId, threadId });
  const [isExpanded, setIsExpanded] = useState(true);

  const displaySources = (sources ?? []).filter(
    (s) => isFileSource(s) || isLinkSource(s)
  );

  if (displaySources.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Sources</span>
          <span className="flex items-center justify-center min-w-[16px] h-3.5 px-0.5 rounded-full bg-background text-[10px] font-medium text-foreground leading-none">
            {displaySources.length}
          </span>
        </div>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            !isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Content area */}
      {isExpanded && (
        <div className="bg-background px-3 py-0.5">
          <ul
            className="list-none space-y-1 m-0 p-0"
            style={{ paddingLeft: 0, marginLeft: 0 }}
          >
            {displaySources.map((source) => {
              const displayName = getDisplayName(source);

              if (isFileSource(source)) {
                const Icon = getFileIcon(source.file.name);
                return (
                  <li
                    key={`${source.file.id}-${source.index}`}
                    className="list-none text-sm text-foreground m-0 p-0 flex items-center gap-1.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                  >
                    <span>{`(${source.index})`} : </span>
                    {Icon && (
                      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <button
                      type="button"
                      title={displayName}
                      onClick={() => downloadFileMutation.mutate(source.file)}
                      className="text-foreground hover:bg-muted/50 rounded px-1 py-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={downloadFileMutation.isPending}
                    >
                      {displayName}
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={`url-${source.index}`}
                  className="list-none text-sm text-foreground m-0 p-0 flex items-center gap-1.5"
                  style={{ paddingLeft: 0, marginLeft: 0 }}
                >
                  <span>{`(${source.index})`} : </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <a
                    title={source.url ?? displayName}
                    href={source.url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:bg-muted/50 rounded px-1 py-0.5 underline underline-offset-2"
                  >
                    {displayName}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
