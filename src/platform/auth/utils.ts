// src/platform/auth/utils.ts
export const parseScopes = (raw?: unknown): string[] =>
    String(raw ?? '').split(/[ ,]+/).map(s => s.trim()).filter(Boolean);
  
  export const isInTeams = (): boolean => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const inTeamsParam = urlParams.get('inTeams') === 'true';
      const embedded = window.parent !== window;
      return inTeamsParam || embedded;
    } catch { return false; }
  };
  