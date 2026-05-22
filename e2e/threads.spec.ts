import { expect, test } from '@playwright/test';

import {
  threadsResponse,
  workspaceFixture,
  workspacesResponse,
} from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/workspaces', (route) =>
    route.fulfill({ json: workspacesResponse })
  );
  await page.route('**/workspaces/**', (route) =>
    route.fulfill({ json: workspaceFixture })
  );
  await page.route('**/messagethreads', (route) =>
    route.fulfill({ json: threadsResponse })
  );
  await page.route('**/messagethreads/**', (route) =>
    route.fulfill({ json: threadsResponse.data[0] })
  );
});

test('navigates to a workspace and thread after auth bypass', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/workspace\/.+\/thread\/.+/, {
    timeout: 30000,
  });

  const chatColumn = page.locator('[data-ss-layer="chat-column"]');
  await expect(chatColumn).toBeVisible({ timeout: 5000 });
});

test('no requests escape to a real backend', async ({ page }) => {
  const escapedRequests: string[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (
      !url.startsWith('http://localhost') &&
      !url.startsWith('https://localhost') &&
      !url.includes('vite') &&
      !url.includes('__vite') &&
      !url.includes('res.cdn.office.net')
    ) {
      escapedRequests.push(url);
    }
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/workspace\/.+\/thread\/.+/, {
    timeout: 30000,
  });

  expect(escapedRequests).toHaveLength(0);
});
