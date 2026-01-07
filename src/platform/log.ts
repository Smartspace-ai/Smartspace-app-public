// src/platform/log.ts
// Lightweight, consistent logging with opt-in debug in production.

type Level = 'debug' | 'info' | 'warn' | 'error';

function safeGetFlag(storage: Storage | undefined, key: string): string | null {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

export function isSsDebugEnabled(): boolean {
  // Enable in dev by default
  if (import.meta.env.DEV) return true;

  // Enable in prod via localStorage/sessionStorage flag
  const v =
    safeGetFlag(typeof localStorage !== 'undefined' ? localStorage : undefined, 'ss_debug') ??
    safeGetFlag(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined, 'ss_debug');
  return v === '1' || v === 'true';
}

function getRunId(): string {
  try {
    const w = window as any;
    if (w.__ssRunId) return String(w.__ssRunId);
    const id = `run_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
    w.__ssRunId = id;
    return id;
  } catch {
    return 'run_unknown';
  }
}

function fmt(scope: string, msg: string) {
  return `[SmartSpace][${scope}][${getRunId()}] ${msg}`;
}

export function ssLog(level: Level, scope: string, msg: string, data?: unknown) {
  const enabled = isSsDebugEnabled();
  if (!enabled && level === 'debug') return;

  const line = fmt(scope, msg);
  // Always emit warn/error; emit info only when enabled.
  if (!enabled && level === 'info') return;

  // eslint-disable-next-line no-console
  const fn = level === 'error'
    ? console.error
    : level === 'warn'
      ? console.warn
      : level === 'info'
        ? console.info
        : console.debug;

  try {
    if (typeof data === 'undefined') fn(line);
    else fn(line, data);
  } catch {
    fn(line);
  }

  // Also persist a small rolling buffer of logs for cases where DevTools aren't accessible (e.g. Teams managed desktops).
  try {
    const w = window as any;
    const arr: any[] = Array.isArray(w.__ssLogs) ? w.__ssLogs : [];
    arr.push({
      t: new Date().toISOString(),
      level,
      scope,
      msg,
      data: (typeof data === 'undefined') ? null : data,
    });
    // cap to last 200 entries
    while (arr.length > 200) arr.shift();
    w.__ssLogs = arr;
  } catch {
    // ignore
  }
}

export const ssDebug = (scope: string, msg: string, data?: unknown) => ssLog('debug', scope, msg, data);
export const ssInfo  = (scope: string, msg: string, data?: unknown) => ssLog('info', scope, msg, data);
export const ssWarn  = (scope: string, msg: string, data?: unknown) => ssLog('warn', scope, msg, data);
export const ssError = (scope: string, msg: string, data?: unknown) => ssLog('error', scope, msg, data);


