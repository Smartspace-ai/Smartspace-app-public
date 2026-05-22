/**
 * Playwright auth helpers for E2E browser integration tests.
 *
 * Auth bypass architecture:
 * - VITE_E2E_AUTH_BYPASS=true is passed to the Vite dev server via playwright.config.ts.
 * - main.tsx detects this flag and skips MSAL entirely, rendering the app directly.
 * - src/platform/auth/index.ts detects the same flag and returns a synthetic
 *   AuthAdapter (getSession returns a fake user, getAccessToken returns a fake token).
 * - The /_protected route's beforeLoad passes because the session is non-null.
 * - All downstream API calls are intercepted by MSW (enabled via VITE_ENABLE_MSW=true).
 *
 * This file provides the `setupAuthBypass` helper for test files. In the current
 * architecture there is nothing to set up at the Playwright level (auth bypass is
 * entirely env-var driven), but the helper is kept as a stable import point for
 * future per-test auth customisation (e.g. different user roles).
 */

import type { Page } from '@playwright/test';

/**
 * Prepare a page for an authenticated E2E session.
 *
 * Currently a no-op because auth is bypassed via VITE_E2E_AUTH_BYPASS=true in
 * the Vite dev server environment (see playwright.config.ts webServer.env).
 * Call this before `page.goto()` so future per-test setup has a consistent hook.
 */
export async function setupAuthBypass(_page: Page): Promise<void> {
  // Auth is handled at the app level via VITE_E2E_AUTH_BYPASS — no Playwright
  // network interception or localStorage seeding needed.
}
