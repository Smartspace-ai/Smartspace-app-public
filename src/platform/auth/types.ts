export type GetTokenOptions = { silentOnly?: boolean; forceRefresh?: boolean; scopes?: string[] };

export interface AuthAdapter {
  getAccessToken(opts?: GetTokenOptions): Promise<string>;
  getSession(): Promise<{ accountId?: string; displayName?: string } | null>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}