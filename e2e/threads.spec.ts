import { expect, test } from '@playwright/test';

const WORKSPACE_ID = 'test-workspace-01';
const THREAD_ID = 'test-thread-01';

const workspacesResponse = {
  data: [
    {
      id: WORKSPACE_ID,
      name: 'Test Workspace',
      description: '',
      isEnabled: true,
    },
  ],
  total: 1,
};

const threadsResponse = {
  data: [
    {
      id: THREAD_ID,
      name: 'Test Thread',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      isFlowRunning: false,
      isPinned: false,
    },
  ],
  total: 1,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/workspaces', (route) =>
    route.fulfill({ json: workspacesResponse })
  );
  await page.route('**/workspaces/**', (route) =>
    route.fulfill({ json: workspacesResponse.data[0] })
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
