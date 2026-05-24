import { expect, test } from '@playwright/test';

const WORKSPACE_ID = 'test-workspace-01';
const THREAD_ID = 'test-thread-01';

const workspaceFixture = {
  id: WORKSPACE_ID,
  name: 'Test Workspace',
  description: '',
  isEnabled: true,
  tags: [],
  showSources: false,
  dataSpaces: [],
  favorited: false,
  summary: '',
  firstPrompt: '',
  variables: {},
  supportsFiles: false,
};

const workspacesResponse = {
  data: [workspaceFixture],
  total: 1,
};

const threadFixture = {
  id: THREAD_ID,
  name: 'Test Thread',
  createdAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'Test User',
  createdByUserId: 'test-user-01',
  isFlowRunning: false,
  lastUpdatedAt: '2024-01-01T00:00:00.000Z',
  lastUpdatedByUserId: 'test-user-01',
  totalMessages: 0,
  favorited: false,
  workSpaceId: WORKSPACE_ID,
};

const threadsResponse = {
  data: [threadFixture],
  total: 1,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/workspaces', (route) =>
    route.fulfill({ json: workspacesResponse })
  );
  // Must be registered before **/workspaces/** so it wins for message-list URLs
  // (e.g. /workspaces/:id/messageThreads/:id/messages).
  await page.route('**/messages', (route) =>
    route.fulfill({ json: { data: [], total: 0 } })
  );
  await page.route('**/workspaces/**', (route) =>
    route.fulfill({ json: workspaceFixture })
  );
  await page.route('**/messagethreads', (route) =>
    route.fulfill({ json: threadsResponse })
  );
  await page.route('**/messagethreads/**', (route) =>
    route.fulfill({ json: threadFixture })
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
