import {
  ChevronUp,
  Download,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Globe,
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

// The hostname is the source's identity; the full URL stays in the tooltip.
function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
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
    <span className="flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium tabular-nums text-muted-foreground">
      {index}
    </span>
  );
}

// Site favicon with a graceful fallback — the service returns a default globe
// for unknown domains, and any load failure drops to the Globe icon.
function SourceFavicon({ host }: { host: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-muted">
      {failed ? (
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
            host
          )}&sz=64`}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-4 w-4 rounded-sm"
        />
      )}
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
      className="m-0 text-xs leading-snug text-muted-foreground line-clamp-2"
    >
      “{text}”
    </p>
  );
}

function CardHeader({
  icon,
  label,
  source,
}: {
  icon: React.ReactNode;
  label: string;
  source: MessageResponseSource;
}) {
  return (
    <span className="flex w-full min-w-0 items-center gap-2">
      {icon}
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground group-hover:underline underline-offset-2">
        {label}
      </span>
      <UnverifiedBadge attribution={source.attribution} />
      <IndexChip index={source.index} />
    </span>
  );
}

const cardClasses =
  'group flex w-full flex-col items-start gap-1 rounded-lg border border-border/60 bg-background p-2.5 text-left no-underline transition-colors hover:border-border hover:bg-muted/40';

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

      {/* Source cards */}
      {isExpanded && (
        <ul className="list-none m-0 grid gap-1.5 p-2 sm:grid-cols-2">
          {displaySources.map((source) => {
            if (isFileSource(source)) {
              return (
                <li
                  key={`${source.file.id}-${source.index}`}
                  className="m-0 p-0 list-none"
                >
                  <button
                    type="button"
                    title={`Download ${source.file.name}`}
                    onClick={() => downloadFileMutation.mutate(source.file)}
                    disabled={downloadFileMutation.isPending}
                    className={cn(
                      cardClasses,
                      'h-full disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    <CardHeader
                      icon={
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                          <Download className="hidden h-3.5 w-3.5 text-muted-foreground group-hover:block" />
                          {(() => {
                            const Icon = getFileIcon(source.file.name);
                            return (
                              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:hidden" />
                            );
                          })()}
                        </span>
                      }
                      label={source.file.name}
                      source={source}
                    />
                    <CitedQuote text={source.citedText} />
                  </button>
                </li>
              );
            }

            const safeHref = source.url ? getSafeUrl(source.url) : null;
            const host = getHost(source.url ?? '');

            const body = (
              <>
                <CardHeader
                  icon={<SourceFavicon host={host} />}
                  label={host}
                  source={source}
                />
                <CitedQuote text={source.citedText} />
              </>
            );

            return (
              <li key={`url-${source.index}`} className="m-0 p-0 list-none">
                {safeHref ? (
                  <a
                    title={source.url ?? host}
                    href={safeHref}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(cardClasses, 'h-full')}
                  >
                    {body}
                  </a>
                ) : (
                  <div
                    className={cn(cardClasses, 'h-full hover:bg-background')}
                  >
                    {body}
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
