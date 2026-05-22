export const WORKSPACE_ID = 'test-workspace-01';
export const THREAD_ID = 'test-thread-01';

export const workspaceFixture = {
  id: WORKSPACE_ID,
  name: 'Test Workspace',
  description: '',
  isEnabled: true,
};

export const workspacesResponse = {
  data: [workspaceFixture],
  total: 1,
};

export const threadFixture = {
  id: THREAD_ID,
  name: 'Test Thread',
  lastMessageAt: '2024-01-01T00:00:00.000Z',
  unreadCount: 0,
  isFlowRunning: false,
  isPinned: false,
};

export const threadsResponse = {
  data: [threadFixture],
  total: 1,
};
