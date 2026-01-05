export type GetTokenOptions = { silentOnly?: boolean; forceRefresh?: boolean; scopes?: string[] };

export interface AuthAdapter {
  getAccessToken(opts?: GetTokenOptions): Promise<string>;
  getSession(): Promise<{ accountId?: string; displayName?: string } | null>;
  /** Start an interactive sign-in. For web, this redirects. */
  signIn(redirectTo?: string): Promise<void>;
  signOut(): Promise<void>;
  getStoredRedirectUrl(): string | null;
  clearStoredRedirectUrl?(): void;
}