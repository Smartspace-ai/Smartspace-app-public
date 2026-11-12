import { ssConfig } from '@/platform/config/ssConfig';

/**
 * Parses a scope string (space or comma separated) into a stable, trimmed list.
 */
export function parseScopes(raw: unknown): string[] {
  return String(raw ?? '')
    .split(/[ ,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns raw client scopes from ss-config.js. */
export function getClientScopesRaw(): unknown {
  return ssConfig('Client_Scopes') ?? '';
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
    (s) => s && !s.includes('smartspaceapi.config.access')
  );
}
