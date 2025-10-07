import { describe, expect, it } from 'vitest';

import * as workspaces from '@/domains/workspaces';

describe('workspaces index exports', () => {
  it('exposes expected APIs', () => {
    expect(workspaces.workspaceKeys.all[0]).toBe('workspaces');
    expect(typeof workspaces.workspacesListOptions).toBe('function');
    expect(typeof workspaces.fetchWorkspaces).toBe('function');
  });
});
