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

// The hostname is the source's identity; the full URL shows when expanded.
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
// `compact` collapses it to just the icon for the pill state.
function UnverifiedBadge({
  attribution,
  compact = false,
}: {
  attribution?: MessageAttribution | null;
  compact?: boolean;
}) {
  if (attribution !== MessageAttribution.Unsupported) return null;
  return (
    <span
      title="This citation couldn't be verified against the source text — double-check it."
      className={cn(
        'inline-flex items-center gap-0.5 rounded text-[10px] font-medium text-amber-600 dark:text-amber-400 flex-shrink-0',
        !compact && 'px-1 py-px bg-amber-500/10'
      )}
    >
      <ShieldAlert className="h-3 w-3" />
      {!compact && 'Unverified'}
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
  if (failed) {
    return <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        host
      )}&sz=64`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-4 w-4 flex-shrink-0 rounded-sm"
    />
  );
}

// The verified span the model cited (the API extracts it from the source's
// own text, so this is what the source actually says — not the model's
// paraphrase). Shown only in the expanded state.
function CitedQuote({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <p className="m-0 text-xs leading-snug text-muted-foreground">“{text}”</p>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 px-0.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

const pillClasses =
  'inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-muted/40';

const expandedCardClasses =
  'w-full rounded-lg border border-border/60 bg-background p-2.5 flex flex-col gap-1.5';

export function ChatMessageSources({
  sources,
}: {
  sources: MessageResponseSource[];
}) {
  const { workspaceId, threadId } = useChatContext();
  const { downloadFileMutation } = useFileMutations({ workspaceId, threadId });
  const [isExpanded, setIsExpanded] = useState(true);
  const [openIndexes, setOpenIndexes] = useState<ReadonlySet<number>>(
    new Set()
  );

  const toggleOpen = (index: number) =>
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const displaySources = (sources ?? []).filter(
    (s) => isFileSource(s) || isLinkSource(s)
  );
  const urlSources = displaySources.filter((s) => !isFileSource(s));
  const fileSources = displaySources.filter(isFileSource);

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

      {/* Compact pills, grouped by kind; each expands in place for detail */}
      {isExpanded && (
        <div className="flex flex-col gap-2.5 p-2.5">
          {urlSources.length > 0 && (
            <div>
              <SectionLabel>URLs</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {urlSources.map((source) => {
                  const host = getHost(source.url ?? '');
                  const safeHref = source.url ? getSafeUrl(source.url) : null;

                  if (!openIndexes.has(source.index)) {
                    return (
                      <button
                        key={`url-${source.index}`}
                        type="button"
                        aria-expanded={false}
                        title={source.url ?? host}
                        onClick={() => toggleOpen(source.index)}
                        className={pillClasses}
                      >
                        <SourceFavicon host={host} />
                        <span className="min-w-0 truncate">{host}</span>
                        <UnverifiedBadge
                          attribution={source.attribution}
                          compact
                        />
                        <IndexChip index={source.index} />
                      </button>
                    );
                  }

                  return (
                    <div
                      key={`url-${source.index}`}
                      className={expandedCardClasses}
                    >
                      <div className="flex w-full items-center gap-2">
                        <SourceFavicon host={host} />
                        {safeHref ? (
                          <a
                            href={safeHref}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 truncate text-sm font-medium text-foreground no-underline hover:underline underline-offset-2"
                          >
                            {host}
                          </a>
                        ) : (
                          <span className="min-w-0 truncate text-sm font-medium text-foreground">
                            {host}
                          </span>
                        )}
                        <UnverifiedBadge attribution={source.attribution} />
                        <IndexChip index={source.index} />
                        <button
                          type="button"
                          aria-expanded
                          aria-label="Collapse source"
                          onClick={() => toggleOpen(source.index)}
                          className="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {source.url && (
                        <p className="m-0 truncate text-xs text-muted-foreground/80">
                          {source.url}
                        </p>
                      )}
                      <CitedQuote text={source.citedText} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {fileSources.length > 0 && (
            <div>
              <SectionLabel>Files</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {fileSources.map((source) => {
                  const Icon = getFileIcon(source.file.name);

                  if (!openIndexes.has(source.index)) {
                    return (
                      <button
                        key={`${source.file.id}-${source.index}`}
                        type="button"
                        aria-expanded={false}
                        title={source.file.name}
                        onClick={() => toggleOpen(source.index)}
                        className={pillClasses}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate">
                          {source.file.name}
                        </span>
                        <UnverifiedBadge
                          attribution={source.attribution}
                          compact
                        />
                        <IndexChip index={source.index} />
                      </button>
                    );
                  }

                  return (
                    <div
                      key={`${source.file.id}-${source.index}`}
                      className={expandedCardClasses}
                    >
                      <div className="flex w-full items-center gap-2">
                        <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {source.file.name}
                        </span>
                        <UnverifiedBadge attribution={source.attribution} />
                        <IndexChip index={source.index} />
                        <button
                          type="button"
                          aria-expanded
                          aria-label="Collapse source"
                          onClick={() => toggleOpen(source.index)}
                          className="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <CitedQuote text={source.citedText} />
                      <button
                        type="button"
                        onClick={() => downloadFileMutation.mutate(source.file)}
                        disabled={downloadFileMutation.isPending}
                        className="inline-flex w-fit items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
