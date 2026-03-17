type SsConfig = { Client_Scopes?: unknown };
type SsWindow = Window & { ssconfig?: SsConfig };

function getSsWindow(): SsWindow | null {
  try {
    return window as unknown as SsWindow;
  } catch {
    return null;
  }
}

/**
 * Parses a scope string coming from Vite env (often comma-separated) or runtime config
 * (often space or comma separated) into a stable, trimmed list.
 */
export function parseScopes(raw: unknown): string[] {
  return String(raw ?? '')
    .split(/[ ,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns raw client scopes from runtime config (preferred) or Vite env. */
export function getClientScopesRaw(): unknown {
  return getSsWindow()?.ssconfig?.Client_Scopes ?? import.meta.env.VITE_CLIENT_SCOPES ?? '';
}

/** Returns parsed client scopes, optionally overridden by a callsite raw value. */
export function getClientScopes(rawOverride?: unknown): string[] {
  return parseScopes(rawOverride ?? getClientScopesRaw());
}

/**
 * API calls should not request scopes that are not meant for the API's auth audience.
 * Historically, this app filtered out `smartspaceapi.config.access`.
 */
export function getApiScopes(rawOverride?: unknown): string[] {
  return getClientScopes(rawOverride).filter(
    (s) => s && !s.includes('smartspaceapi.config.access'),
  );
}


