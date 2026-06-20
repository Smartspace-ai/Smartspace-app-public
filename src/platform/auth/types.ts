export type GetTokenOptions = {
  silentOnly?: boolean;
  forceRefresh?: boolean;
  scopes?: string[];
};

export type SignInOptions = {
  /** UPN or email hint so Azure AD can auto-select the account (avoids "Pick an account" prompt). */
  loginHint?: string;
  /**
   * Explicit return URL after sign-in completes. Falls back to the `?redirect`
   * query param, then `/workspace`. Passed by reactive re-auth (which fires from
   * an arbitrary page with no `?redirect` in the URL) so the user returns to the
   * page they were on. Consumed on the `/` landing route after the MSAL redirect.
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
