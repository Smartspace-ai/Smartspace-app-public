export const WORKSPACE_ID = 'test-workspace-01';
export const THREAD_ID = 'test-thread-01';

export const workspaceFixture = {
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

export const workspacesResponse = {
  data: [workspaceFixture],
  total: 1,
};

export const threadFixture = {
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

export const threadsResponse = {
  data: [threadFixture],
  total: 1,
};
