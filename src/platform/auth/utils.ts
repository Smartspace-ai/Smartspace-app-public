// src/platform/auth/utils.ts
export const parseScopes = (raw?: unknown): string[] =>
    String(raw ?? '').split(/[ ,]+/).map(s => s.trim()).filter(Boolean);
  
  export const isInTeams = (): boolean => {
    try {
      // In Teams desktop, the initial load may include ?inTeams=true, but subsequent navigations
      // (or a reload on a deep link) can drop the query param. Also, desktop may not always be an iframe.
      // So we make Teams detection "sticky" once we know we're in Teams.
      const isTestMode = (() => {
        try { return (import.meta as any)?.env?.MODE === 'test'; } catch { return false; }
      })();

      const anyWin = window as any;
      if (anyWin?.__teamsState?.isInTeams) return true;

      const KEY = 'ss_inTeams';
      if (!isTestMode) {
        try { if (sessionStorage.getItem(KEY) === '1') return true; } catch { /* ignore */ }
        try { if (localStorage.getItem(KEY) === '1') return true; } catch { /* ignore */ }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const inTeamsParam = urlParams.get('inTeams') === 'true';
      const embedded = window.parent !== window;
      const detected = inTeamsParam || embedded;

      if (detected && !isTestMode) {
        try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
        try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      }

      return detected;
    } catch { return false; }
  };
  