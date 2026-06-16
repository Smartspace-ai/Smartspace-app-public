import { useEffect, useState } from 'react';

import { isSsDebugEnabled } from '@/platform/log';

import { getBrandConfig } from '@/theme/branding';

import { Logo } from '@/assets/logo';

type TeamsLoaderProps = {
  message?: string;
};

type SsLogEntry = {
  t: string;
  level: string;
  scope: string;
  msg: string;
  data: unknown;
};

/**
 * Debug panel is shown when the standard ss_debug flag is on OR when the URL
 * carries ?ssdebug=1. The URL form lets us surface logs inside Teams Desktop,
 * where there's no DevTools/console to read window.__ssLogs from.
 */
function isDebugPanelEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('ssdebug') === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return isSsDebugEnabled();
}

function safeData(d: unknown): string {
  if (d == null || d === '') return '';
  try {
    return typeof d === 'string' ? d : JSON.stringify(d);
  } catch {
    return '';
  }
}

/**
 * On-screen tail of window.__ssLogs. Polls every second so it keeps updating
 * while the route loader is still pending — i.e. it stays useful precisely when
 * the app is "stuck", which is when you need it most.
 */
function DebugLogPanel() {
  const [logs, setLogs] = useState<SsLogEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      try {
        const w = window as unknown as { __ssLogs?: SsLogEntry[] };
        setLogs((w.__ssLogs ?? []).slice(-40));
      } catch {
        /* ignore */
      }
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const copyAll = async () => {
    try {
      const w = window as unknown as { __ssLogs?: unknown };
      await navigator.clipboard.writeText(
        JSON.stringify(w.__ssLogs ?? [], null, 2)
      );
    } catch {
      /* clipboard may be blocked; the on-screen text is still readable */
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '45vh',
        overflow: 'auto',
        background: 'rgba(0,0,0,0.88)',
        color: '#d6f5d6',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        padding: 8,
        zIndex: 2147483647,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span>
          ss debug · stuck {elapsed}s · {logs.length} recent log lines
        </span>
        <button
          onClick={copyAll}
          style={{
            background: '#2dd36f',
            color: '#000',
            border: 0,
            borderRadius: 4,
            padding: '2px 10px',
            cursor: 'pointer',
          }}
        >
          Copy all logs
        </button>
      </div>
      {logs.map((l, i) => (
        <div
          key={i}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color:
              l.level === 'error'
                ? '#ffd166'
                : l.level === 'warn'
                ? '#ffe08a'
                : '#d6f5d6',
          }}
        >
          {`${(l.t || '').slice(11, 23)} [${l.scope}] ${l.msg}${
            l.data ? ' ' + safeData(l.data) : ''
          }`}
        </div>
      ))}
    </div>
  );
}

export function TeamsLoader({ message = 'Loading…' }: TeamsLoaderProps) {
  const brand = getBrandConfig();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="rounded-2xl bg-gradient-to-br from-primary/40 via-primary/15 to-transparent p-[1px] shadow-xl">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card/75 px-9 py-8 backdrop-blur">
          <div className="opacity-95">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-[40px] max-w-[240px] object-contain"
              />
            ) : (
              <Logo />
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">{brand.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Preparing your workspace…
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-sm">{message}</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/35 [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
      {isDebugPanelEnabled() && <DebugLogPanel />}
    </div>
  );
}

export default TeamsLoader;
