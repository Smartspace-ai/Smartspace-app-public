// src/app/providers/TeamsProvider.tsx
import { app } from '@microsoft/teams-js';
import {
    createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';

import { isInTeams as detectIsInTeams } from '@/platform/auth/utils';

type TeamsTheme = 'default' | 'dark' | 'contrast';

interface TeamsContextType {
  isInTeams: boolean;
  teamsContext: app.Context | null;
  isTeamsInitialized: boolean;
  teamsTheme: TeamsTheme;
  teamsUser: app.Context['user'] | null;
}

const TeamsContext = createContext<TeamsContextType>({
  isInTeams: false,
  teamsContext: null,
  isTeamsInitialized: false,
  teamsTheme: 'default',
  teamsUser: null,
});

export const useTeams = () => useContext(TeamsContext);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const likelyInTeams = detectIsInTeams();

  const [isInTeams, setIsInTeams] = useState(likelyInTeams);
  const [teamsContext, setTeamsContext] = useState<app.Context | null>(null);
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(!likelyInTeams);
  const [teamsTheme, setTeamsTheme] = useState<TeamsTheme>('default');
  const [teamsUser, setTeamsUser] = useState<app.Context['user'] | null>(null);

  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Optional: expose minimal global for your axios interceptor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __teamsState?: unknown }).__teamsState = {
        isInTeams, isInitialized: isTeamsInitialized, teamsContext, teamsUser, teamsTheme,
      };
    }
  }, [isInTeams, isTeamsInitialized, teamsContext, teamsUser, teamsTheme]);

  // Apply Teams theme to our document so Tailwind/shadcn CSS variables switch correctly.
  // Tailwind "dark" mode is class-based in this app.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!likelyInTeams) return;

    const root = document.documentElement;
    try {
      const applyLight = () => {
        // TEMP: force light theme in Teams regardless of host theme.
        // This keeps the UI consistent with the (light) web UI.
        root.classList.remove('dark');
        document.body?.classList?.remove?.('dark');
        document.getElementById('root')?.classList?.remove?.('dark');

        // Force the critical CSS vars used by bg-background / from-background so Teams web
        // can't make the page look "dark" via host-injected styling.
        // (HSL tokens; matches the light theme defaults in src/_theme.scss)
        root.style.setProperty('--background', '0 0% 100%');
        root.style.setProperty('--popover', '0 0% 100%');

        // Prefer light form control rendering too.
        (root.style as unknown as CSSStyleDeclaration & { colorScheme?: string }).colorScheme = 'light';
      };

      applyLight();

      // Also stamp a theme marker for any future CSS overrides.
      root.setAttribute('data-teams-theme', 'default');

      // Teams web can re-apply classes/styles after load; keep light pinned.
      const obs = new MutationObserver(() => applyLight());
      obs.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
      try {
        if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
      } catch { /* ignore */ }
      return () => obs.disconnect();

    } catch {
      // ignore DOM failures
    }
  }, [teamsTheme, likelyInTeams]);

  useEffect(() => {
    if (!likelyInTeams) {
      // not embedded: nothing to do
      return;
    }

    let cancelled = false;

    (async () => {
      for (let attempt = 1; attempt <= 3 && !cancelled; attempt++) {
        try {
          await app.initialize();
          if (cancelled) return;

          setIsInTeams(true);

          const ctx = await app.getContext();
          if (cancelled) return;

          setTeamsContext(ctx);
          setTeamsUser(ctx.user ?? null);
          setTeamsTheme(((ctx as unknown as { app?: { theme?: unknown } }).app?.theme ?? 'default') as TeamsTheme);

          // theme changes (no unregister API, guard with mounted ref)
          app.registerOnThemeChangeHandler((theme) => {
            if (mounted.current) setTeamsTheme(theme as TeamsTheme);
          });

          if (typeof navigator !== 'undefined' && typeof document !== 'undefined') {
            if (/android/i.test(navigator.userAgent)) {
              document.body.setAttribute('data-teams-android', 'true');
            }
          }

          break; // success
        } catch {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          } else {
            setIsInTeams(false);
            setTeamsContext(null);
            setTeamsUser(null);
          }
        }
      }
      if (!cancelled) setIsTeamsInitialized(true);
    })();

    return () => { cancelled = true; };
  }, [likelyInTeams]);

  const value = useMemo(
    () => ({ isInTeams, teamsContext, isTeamsInitialized, teamsTheme, teamsUser }),
    [isInTeams, teamsContext, isTeamsInitialized, teamsTheme, teamsUser]
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}
