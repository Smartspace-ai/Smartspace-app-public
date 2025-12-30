import { describe, expect, it } from 'vitest';

import { mapWorkspaceDtoToModel, mapWorkspacesDtoToModels } from '@/domains/workspaces/mapper';

describe('workspaces mapper', () => {
  it('maps workspace dto with defaults and avatar', () => {
    const dto = {
      id: 'w1', name: 'Acme Workspace',
      showSources: null, dataSpaces: null,
      createdByUserId: null, createdAt: null,
      modifiedByUserId: null, modifiedAt: null,
      favorited: null,
      summary: null, firstPrompt: null,
      outputSchema: null, isPromptAndResponseLoggingEnabled: null, inputs: null,
      variables: { a: { schema: {}, access: 'Write' } },
      sandBoxThreadId: null, supportsFiles: null,
      avatarName: null,
    } as any;
    const m = mapWorkspaceDtoToModel(dto);
    expect(m.id).toBe('w1');
    expect(m.avatarName).toBe('AW');
    expect(m.variables?.a?.access).toBe('Write');
  });

  it('maps list', () => {
    const res = mapWorkspacesDtoToModels([{ id: 'w2', name: 'B' } as any]);
    expect(res[0].id).toBe('w2');
  });
});


