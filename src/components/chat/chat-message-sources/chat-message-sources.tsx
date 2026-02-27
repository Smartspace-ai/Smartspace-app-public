import { useState } from 'react';
import { ChevronUp, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation } from 'lucide-react';
import { MessageResponseSourceType } from '../../../enums/message-response-source-type';
import { MessageResponseSource } from '../../../models/message-response-source';
import { cn } from '../../../lib/utils';
import { useFileMutations } from '@/hooks/use-files';
// Re-export for convenience
export type { MessageResponseSource };

// Utility function to get file type icon
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

export interface ChatMessageSourceProps {
  source: MessageResponseSource;
}

// Single source item component
function ChatMessageSource({ source }: ChatMessageSourceProps) {
  const { downloadFileMutation } = useFileMutations();

  // Only handle File type sources
  if (source.sourceType !== MessageResponseSourceType.File || !source.file) {
    return null;
  }

  const file = source.file;

  const handleDownload = () => {
    downloadFileMutation.mutate(file);
  };

  const displayName = file.name || `Source ${source.index}`;
  const Icon = getFileIcon(file.name);

  return (
    <li className="list-none text-sm text-foreground m-0 p-0 flex items-center gap-1.5" style={{ paddingLeft: 0, marginLeft: 0 }}>
      <span>{`(${source.index})`} : </span>
      {Icon && (
        <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <button
        type="button"
        title={displayName}
        onClick={handleDownload}
        className="text-foreground hover:bg-muted/50 rounded px-1 py-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={downloadFileMutation.isPending}
      >
        {displayName}
      </button>
    </li>
  );
}

// List of sources component
export interface ChatMessageSourcesProps {
  sources: MessageResponseSource[];
}

export function ChatMessageSources({ sources }: ChatMessageSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filter to only show File type sources
  const fileSources = sources.filter(
    (source) => source.sourceType === MessageResponseSourceType.File && source.file
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
          <ul className="list-none space-y-1 m-0 p-0" style={{ paddingLeft: 0, marginLeft: 0 }}>
            {fileSources.map((source, idx) => (
              <ChatMessageSource key={idx} source={source} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
