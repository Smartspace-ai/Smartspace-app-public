export type BrandConfig = {
  name: string;
  logoUrl?: string | null;
};

function cleanString(x: unknown): string | null {
  if (typeof x !== 'string') return null;
  const s = x.trim();
  return s ? s : null;
}

function readCssVar(name: string): string | null {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined')
      return null;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return cleanString(v);
  } catch {
    return null;
  }
}

function readSsConfigKey(keys: string[]): string | null {
  try {
    const w = window as unknown as { ssconfig?: Record<string, unknown> };
    const cfg = w?.ssconfig;
    if (!cfg) return null;
    for (const k of keys) {
      const v = cleanString(cfg[k]);
      if (v) return v;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve the current brand name/logo from the same "theme/whitelabel" sources used at runtime.
 *
 * Supported sources (in priority order):
 * - CSS vars: `--ss-brand-name`, `--ss-brand-logo-url`
 * - Runtime config: `window.ssconfig.*` (supports a few common key names)
 * - Document title (for name)
 * - Defaults ("Smartspace", no logoUrl)
 */
export function getBrandConfig(): BrandConfig {
  const name =
    readCssVar('--ss-brand-name') ??
    readSsConfigKey([
      'Brand_Name',
      'Theme_Name',
      'App_Name',
      'Product_Name',
      'Tenant_Name',
    ]) ??
    (typeof document !== 'undefined' ? cleanString(document.title) : null) ??
    'Smartspace';

  const logoUrl =
    readCssVar('--ss-brand-logo-url') ??
    readSsConfigKey([
      'Brand_Logo_Uri',
      'Brand_Logo_Url',
      'Theme_Logo_Uri',
      'Theme_Logo_Url',
      'App_Logo_Uri',
      'App_Logo_Url',
      'Product_Logo_Uri',
      'Product_Logo_Url',
    ]) ??
    null;

  return { name, logoUrl };
}
