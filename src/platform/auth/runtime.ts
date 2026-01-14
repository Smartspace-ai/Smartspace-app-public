export type AuthRuntimeErrorSource = 'teams' | 'web' | 'api';

export type AuthRuntimeError = {
  source: AuthRuntimeErrorSource;
  message: string;
  at: number;
};

export type AuthRuntimeState = {
  /** `null` until we have any signal; `true` inside Teams, `false` otherwise. */
  isInTeams: boolean | null;
  lastError: AuthRuntimeError | null;
};

type Listener = () => void;

let state: AuthRuntimeState = { isInTeams: null, lastError: null };
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

export function setRuntimeAuthError(error: { source: AuthRuntimeErrorSource; message: string } | null) {
  const next = error ? { ...error, at: Date.now() } : null;
  state = { ...state, lastError: next };
  emit();
}


