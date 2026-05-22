/**
 * Playwright auth helpers for E2E browser integration tests.
 *
 * Auth bypass: VITE_E2E_AUTH_BYPASS=true is passed to the Vite dev server via
 * playwright.config.ts. main.tsx skips MSAL; src/platform/auth/index.ts returns a
 * synthetic adapter so the /_protected guard passes. API calls are intercepted
 * per-test via page.route().
 */
