export type GetTokenOptions = {
  silentOnly?: boolean;
  forceRefresh?: boolean;
  scopes?: string[];
};

export type SignInOptions = {
  /** UPN or email hint so Azure AD can auto-select the account (avoids "Pick an account" prompt). */
  loginHint?: string;
  /**
   * Where to return after sign-in completes. Defaults to the `?redirect` query
   * param, else `/workspace`. Passed by reactive re-auth so the user lands back
   * on the page they were on, not the workspace root.
   */
  redirectUrl?: string;
};

export interface AuthAdapter {
  getAccessToken(opts?: GetTokenOptions): Promise<string>;
  getSession(): Promise<{ accountId?: string; displayName?: string } | null>;
  signIn(opts?: SignInOptions): Promise<void>;
  signOut(): Promise<void>;
  getStoredRedirectUrl(): string | null;
}
