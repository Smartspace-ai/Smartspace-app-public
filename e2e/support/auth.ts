/**
 * Playwright auth helpers for E2E browser integration tests.
 *
 * Auth bypass: VITE_E2E_AUTH_BYPASS=true is passed to the Vite dev server via
 * playwright.config.ts. main.tsx skips MSAL; src/platform/auth/index.ts returns a
 * synthetic adapter so the /_protected guard passes. API calls are intercepted
 * per-test via page.route().
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
