/**
 * Browser integration test: thread list renders with MSW-intercepted API calls.
 *
 * Architecture:
 * - Vite dev server starts with VITE_ENABLE_MSW=true and VITE_E2E_AUTH_BYPASS=true
 *   (see playwright.config.ts webServer.env).
 * - main.tsx checks VITE_E2E_AUTH_BYPASS and skips MSAL entirely, rendering the
 *   React app directly without an MsalProvider.
 * - src/platform/auth/index.ts checks the same flag and returns a synthetic
 *   AuthAdapter: getSession() returns a fake user, getAccessToken() returns a
 *   fake bearer token. The /_protected route's beforeLoad() passes.
 * - VITE_ENABLE_MSW=true triggers worker.start() in main.tsx, registering the
 *   MSW service worker before the app initialises. All API calls are then
 *   intercepted by the shared MSW handlers (same handlers/factories as Vitest).
 */

import { expect, test } from '@playwright/test';

import { setupAuthBypass } from './support/auth';

test.describe('Thread list integration', () => {
  test.beforeEach(async ({ page }) => {
    // setupAuthBypass is a no-op — auth bypass is env-var driven via VITE_E2E_AUTH_BYPASS.
    // It's kept as a stable hook for future per-test auth customisation.
    await setupAuthBypass(page);
  });

  test('navigates to a workspace and thread after auth bypass', async ({
    page,
  }) => {
    // Navigate to the app root. The router will:
    //   / → /_protected (session check passes via E2E auth adapter)
    //   → /workspace/ (workspaces loaded via MSW)
    //   → /workspace/$workspaceId/ (first workspace)
    //   → /workspace/$workspaceId/thread/$threadId (first thread)
    await page.goto('/');

    // Wait for the URL to advance to a workspace/thread route, confirming:
    // 1. E2E auth adapter returned a valid session (no redirect to /login)
    // 2. GET /WorkSpaces was intercepted by MSW and returned factory data
    // 3. GET /WorkSpaces/:id/messageThreads was intercepted and returned threads
    // 4. Router redirected through the cascade to a thread page
    await expect(page).toHaveURL(/\/workspace\/.+\/thread\/.+/, {
      timeout: 30000,
    });

    // Verify the main chat layout rendered (data-ss-layer="chat-column" is always
    // present when the workspace/thread layout component mounts).
    const chatColumn = page.locator('[data-ss-layer="chat-column"]');
    await expect(chatColumn).toBeVisible({ timeout: 5000 });
  });

  test('MSW intercepts API calls — no requests escape to a real backend', async ({
    page,
  }) => {
    const msalOrBackendRequests: string[] = [];

    // Watch for any requests to non-localhost URLs (these would escape MSW and
    // indicate the test environment isn't fully isolated).
    page.on('request', (req) => {
      const url = req.url();
      // Exclude localhost, vite HMR, and known static SDK assets that are
      // intentionally fetched from CDNs (Teams JS valid-domains JSON):
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('https://localhost') &&
        !url.includes('vite') &&
        !url.includes('__vite') &&
        // Teams JS SDK fetches its valid-domains list from office.net CDN at startup.
        // This is a static resource fetch, not a backend API call.
        !url.includes('res.cdn.office.net')
      ) {
        msalOrBackendRequests.push(url);
      }
    });

    await page.goto('/');

    // Wait for navigation to confirm the API round-trips completed.
    await expect(page).toHaveURL(/\/workspace\/.+\/thread\/.+/, {
      timeout: 30000,
    });

    // No backend API requests escaped to external services — MSW handled everything
    // locally. MSAL is bypassed via VITE_E2E_AUTH_BYPASS so no Azure AD calls fire.
    // (Teams JS SDK CDN fetches for static resources are excluded from this check.)
    expect(msalOrBackendRequests).toHaveLength(0);
  });
});
