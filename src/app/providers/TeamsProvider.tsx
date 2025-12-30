// src/app/providers/TeamsProvider.tsx
import { app } from '@microsoft/teams-js';
import {
    createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';

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
  // quick heuristic: iframe or ?inTeams=true → likely inside Teams
  const likelyInTeams = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const inParam = new URLSearchParams(window.location.search).get('inTeams') === 'true';
      const embedded = window.parent !== window;
      return inParam || embedded;
    } catch {
      return false;
    }
  })();

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
      (window as any).__teamsState = {
        isInTeams, isInitialized: isTeamsInitialized, teamsContext, teamsUser,
      };
    }
  }, [isInTeams, isTeamsInitialized, teamsContext, teamsUser]);

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
          setTeamsTheme(((ctx as any).app?.theme ?? 'default') as TeamsTheme);

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
