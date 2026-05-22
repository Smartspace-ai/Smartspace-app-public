import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import { isoDate, uuid } from './primitives';

export const makeWorkspace = (
  overrides: Partial<ChatModels.WorkSpacesWorkSpace> = {}
): ChatModels.WorkSpacesWorkSpace => ({
  id: uuid(),
  name: faker.company.name(),
  createdAt: isoDate(),
  createdByUserId: uuid(),
  favorited: false,
  showSources: false,
  dataSpaces: [],
  modelConfigurations: [],
  inputs: {},
  variables: {},
  firstPrompt: null,
  summary: null,
  outputSchema: null,
  sandBoxThreadId: null,
  supportsFiles: null,
  tags: null,
  modifiedAt: null,
  modifiedByUserId: null,
  ...overrides,
});

export const makeWorkspacesResponse = (
  workspaces: ChatModels.WorkSpacesWorkSpace[] = [makeWorkspace()]
): { data: ChatModels.WorkSpacesWorkSpace[] } => ({
  data: workspaces,
});
