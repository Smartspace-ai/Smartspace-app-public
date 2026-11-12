/**
 * Install configuration. `ss-config.js` sets `window.ssconfig` before the app
 * loads: a deploy writes that file, and the dev server answers it from the
 * `VITE_*` variables (see vite.config.mts). The build itself carries none of
 * these values, so one build runs on any install.
 */
export type SsConfigKey =
  | 'Client_Id'
  | 'Tenant_Id'
  | 'Client_Authority'
  | 'Client_Scopes'
  | 'Chat_Api_Uri'
  | 'Teams_Sso_Resource'
  | 'Teams_Use_Msal';

/** The trimmed value, or undefined when the key is unset or empty. */
export function ssConfig(key: SsConfigKey): string | undefined {
  const value = (
    window as unknown as { ssconfig?: Partial<Record<SsConfigKey, unknown>> }
  ).ssconfig?.[key];
  // A hand-written ss-config.js may set Teams_Use_Msal as a boolean.
  if (typeof value === 'boolean') return String(value);
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
}

/**
 * What ss-config.js must set for the app to sign in and reach the API.
 * Client_Authority and Tenant_Id cover each other: the authority is built from
 * the tenant id when it is not given.
 */
export function missingSsConfigKeys(): string[] {
  const missing: string[] = (
    ['Client_Id', 'Client_Scopes', 'Chat_Api_Uri'] as const
  ).filter((key) => ssConfig(key) === undefined);
  if (!ssConfig('Client_Authority') && !ssConfig('Tenant_Id')) {
    missing.push('Client_Authority or Tenant_Id');
  }
  return missing;
}
