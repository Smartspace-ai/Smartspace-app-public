import {
  ChevronUp,
  Download,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';

import { useChatContext } from '@/platform/chat';

import { useFileMutations } from '@/domains/files/mutations';
import {
  MessageAttribution,
  MessageResponseSourceType,
} from '@/domains/messages/enums';
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
  uri?: string | null;
  citedText?: string | null;
  attribution?: MessageAttribution | null;
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

function getSafeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

// "www.metservice.com/towns-cities/.../7-days" reads as noise in a list; the
// hostname is the identity, the path is detail. Split so they can be styled apart.
function getUrlParts(url: string): { host: string; path: string | null } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const tail = `${parsed.pathname === '/' ? '' : parsed.pathname}${
      parsed.search
    }`;
    return { host, path: tail || null };
  } catch {
    return { host: url, path: null };
  }
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

// The source text couldn't be found to back the model's claim — surface it so
// the reader knows to double-check. Only the clear signal is flagged;
// `supported`/`partial` (and older responses with no attribution) stay quiet.
function UnverifiedBadge({
  attribution,
}: {
  attribution?: MessageAttribution | null;
}) {
  if (attribution !== MessageAttribution.Unsupported) return null;
  return (
    <span
      title="This citation couldn't be verified against the source text — double-check it."
      className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 flex-shrink-0"
    >
      <ShieldAlert className="h-3 w-3" />
      Unverified
    </span>
  );
}

// Matches the (N) markers in the message body so the reader can jump
// from a claim to its source.
function IndexChip({ index }: { index: number }) {
  return (
    <span className="mt-0.5 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium tabular-nums text-muted-foreground">
      {index}
    </span>
  );
}

// The verified span the model cited, shown as a visible quote line under
// the source (the API extracts it from the source's own text, so this is
// what the source actually says — not the model's paraphrase).
function CitedQuote({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <p
      title={text}
      className="m-0 mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2"
    >
      “{text}”
    </p>
  );
}

export function ChatMessageSources({
  sources,
}: {
  sources: MessageResponseSource[];
}) {
  const { workspaceId, threadId } = useChatContext();
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
        <ul className="list-none m-0 bg-background p-1.5 divide-y divide-border/50">
          {displaySources.map((source) => {
            if (isFileSource(source)) {
              const Icon = getFileIcon(source.file.name);
              return (
                <li
                  key={`${source.file.id}-${source.index}`}
                  className="m-0 p-0 list-none"
                >
                  <button
                    type="button"
                    title={source.file.name}
                    onClick={() => downloadFileMutation.mutate(source.file)}
                    disabled={downloadFileMutation.isPending}
                    className="group flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <IndexChip index={source.index} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate text-sm font-medium text-foreground group-hover:underline underline-offset-2">
                          {source.file.name}
                        </span>
                        <UnverifiedBadge attribution={source.attribution} />
                      </span>
                      <CitedQuote text={source.citedText} />
                    </span>
                    <Download className="ml-auto mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </button>
                </li>
              );
            }

            const safeHref = source.url ? getSafeUrl(source.url) : null;
            const { host, path } = getUrlParts(source.url ?? '');

            const nameLine = (
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="flex-shrink-0 text-sm font-medium text-foreground group-hover:underline underline-offset-2">
                    {host}
                  </span>
                  {path && (
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {path}
                    </span>
                  )}
                  <UnverifiedBadge attribution={source.attribution} />
                </span>
                <CitedQuote text={source.citedText} />
              </span>
            );

            return (
              <li key={`url-${source.index}`} className="m-0 p-0 list-none">
                {safeHref ? (
                  <a
                    title={source.url ?? host}
                    href={safeHref}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <IndexChip index={source.index} />
                    {nameLine}
                    <ExternalLink className="ml-auto mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </a>
                ) : (
                  <div className="group flex items-start gap-2 rounded-md px-1.5 py-1.5">
                    <IndexChip index={source.index} />
                    {nameLine}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
