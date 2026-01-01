// src/platform/realtime/realtimeDebug.ts

type AnyRecord = Record<string, unknown>;

function readDebugFlagFromStorage(): boolean {
  try {
    const v =
      localStorage.getItem('ss:signalrDebug') ??
      localStorage.getItem('ss:realtimeDebug') ??
      sessionStorage.getItem('ss:signalrDebug') ??
      sessionStorage.getItem('ss:realtimeDebug');
    if (!v) return false;
    return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
  } catch {
    return false;
  }
}

function readDebugFlagFromEnv(): boolean {
  const raw = String(import.meta.env.VITE_SIGNALR_DEBUG ?? import.meta.env.VITE_REALTIME_DEBUG ?? '');
  if (!raw) return false;
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes';
}

export function isRealtimeDebugEnabled(): boolean {
  return readDebugFlagFromEnv() || readDebugFlagFromStorage();
}

function safeJson(value: unknown): unknown {
  // Avoid "Converting circular structure to JSON" and keep logs readable.
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? String(v) : v)),
    );
  } catch {
    return value;
  }
}

export function realtimeDebugLog(message: string, details?: AnyRecord): void {
  if (!isRealtimeDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(
    `[Realtime] ${message}`,
    details ? safeJson(details) : undefined,
  );
}





