export type AuthRuntimeErrorSource = 'teams' | 'web' | 'api';

export type AuthRuntimeError = {
  source: AuthRuntimeErrorSource;
  message: string;
  at: number;
};

const MSAL_IN_TEAMS_KEY = 'ss_teams_use_msal';

export type AuthRuntimeState = {
  /** `null` until we have any signal; `true` inside Teams, `false` otherwise. */
  isInTeams: boolean | null;
  lastError: AuthRuntimeError | null;
};

type Listener = () => void;

let state: AuthRuntimeState = {
  isInTeams: null,
  lastError: null,
};
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function getAuthRuntimeState(): AuthRuntimeState {
  return state;
}

export function subscribeAuthRuntime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRuntimeIsInTeams(isInTeams: boolean) {
  if (state.isInTeams === isInTeams) return;
  state = { ...state, isInTeams };
  emit();
}

export function setRuntimeAuthError(
  error: { source: AuthRuntimeErrorSource; message: string } | null
) {
  const next = error ? { ...error, at: Date.now() } : null;
  state = { ...state, lastError: next };
  emit();
}

export function getStoredUseMsalInTeams(): boolean | null {
  try {
    const v = localStorage.getItem(MSAL_IN_TEAMS_KEY);
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
}

export function setStoredUseMsalInTeams(useMsal: boolean) {
  try {
    localStorage.setItem(MSAL_IN_TEAMS_KEY, useMsal ? '1' : '0');
  } catch {
    /* ignore */
  }
}
