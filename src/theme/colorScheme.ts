import { useCallback, useSyncExternalStore } from 'react';

/**
 * Light/dark switching for the app shell.
 *
 * Tailwind is configured with `darkMode: ['class']`, so the whole palette keys
 * off a single `dark` class on `<html>`. This module owns that class plus the
 * `color-scheme` property (which drives native scrollbars, form controls and
 * the browser's own dark rendering), and persists the user's choice.
 *
 * State lives in a module-level store rather than a context so that unrelated
 * consumers — the header's toggle and the MUI palette in `AppProviders` — stay
 * in sync without threading a provider through the tree.
 */
export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'ss-color-scheme';

function readStored(): ColorScheme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function systemPreference(): ColorScheme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

/** Stored choice if there is one, otherwise whatever the OS asks for. */
export function resolveInitialColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'light';
  return readStored() ?? systemPreference();
}

/** Put `scheme` on the document. Safe to call before React mounts. */
export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', scheme === 'dark');
  root.style.colorScheme = scheme;
}

let current: ColorScheme = resolveInitialColorScheme();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setColorScheme(scheme: ColorScheme): void {
  if (scheme === current) return;
  current = scheme;
  applyColorScheme(scheme);
  try {
    window.localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    /* private mode — the class is still applied, just not remembered */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ColorScheme {
  return current;
}

/**
 * Apply the resolved scheme immediately, and keep following the OS for as long
 * as the user hasn't picked a scheme themselves. Called once at boot.
 */
export function initColorScheme(): void {
  applyColorScheme(current);
  if (typeof window === 'undefined' || readStored()) return;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', () => {
    if (readStored()) return;
    current = mql.matches ? 'dark' : 'light';
    applyColorScheme(current);
    emit();
  });
}

export function useColorScheme() {
  const scheme = useSyncExternalStore<ColorScheme>(
    subscribe,
    getSnapshot,
    () => 'light'
  );
  const toggle = useCallback(
    () => setColorScheme(scheme === 'dark' ? 'light' : 'dark'),
    [scheme]
  );
  return {
    scheme,
    isDark: scheme === 'dark',
    setScheme: setColorScheme,
    toggle,
  };
}
