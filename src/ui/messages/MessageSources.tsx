
import { ChevronUp, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation } from 'lucide-react';
import { useState } from 'react';

import { useFileMutations } from '@/domains/files/mutations';
import { MessageResponseSourceType } from '@/domains/messages/enums';
// Keeping this component generic; adjust type if needed in the future

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';

import { cn } from '@/shared/utils/utils';

export type MessageResponseSource = {
  index: number;
  datasetItemId?: string;
  containerItemId?: string | null;
  flowRunId?: string;
  file?: { id: string; name: string };
  sourceType: MessageResponseSourceType;
};

// Utility function to get file type icon (mirrors Spencers-Ui behavior)
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
    return FileImage;
  }

  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
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
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css', 'json', 'xml', 'md'].includes(extension || '')) {
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

export function ChatMessageSources({
  sources,
}: { sources: MessageResponseSource[] }) {
  const { workspaceId, threadId } = useRouteIds();
  const { downloadFileMutation } = useFileMutations({ workspaceId, threadId });
  const [isExpanded, setIsExpanded] = useState(true);

  const fileSources = (sources ?? []).filter(
    (s) => s.sourceType === MessageResponseSourceType.File && !!s.file
  );

  if (fileSources.length === 0) return null;

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
            {fileSources.length}
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
            {fileSources.map((source) => {
              const file = source.file!;
              const displayName = file.name || `Source ${source.index}`;
              const Icon = getFileIcon(file.name);

              return (
                <li
                  key={`${file.id}-${source.index}`}
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
                    onClick={() => downloadFileMutation.mutate(file)}
                    className="text-foreground hover:bg-muted/50 rounded px-1 py-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={downloadFileMutation.isPending}
                  >
                    {displayName}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
