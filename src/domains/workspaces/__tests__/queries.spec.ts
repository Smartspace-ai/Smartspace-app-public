import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import * as workspaces from '@/domains/workspaces';
import { taggableUsersOptions, workspaceDetailOptions, workspacesListOptions } from '@/domains/workspaces/queries';

describe('workspaces queries options', () => {
  it('workspacesListOptions composes key and calls service', async () => {
    const spy = vi.spyOn(workspaces, 'fetchWorkspaces').mockResolvedValueOnce([] as any);
    const opts = workspacesListOptions('abc');
    expect(opts.queryKey).toEqual(['workspaces', 'list', { searchTerm: 'abc' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('abc');
    spy.mockRestore();
  });

  it('workspaceDetailOptions composes key and calls service', async () => {
    const spy = vi.spyOn(workspaces, 'fetchWorkspace').mockResolvedValueOnce({ id: 'w1' } as any);
    const opts = workspaceDetailOptions('w1');
    expect(opts.queryKey).toEqual(['workspaces', { id: 'w1' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('w1');
    spy.mockRestore();
  });

  it('taggableUsersOptions composes key and calls service', async () => {
    const spy = vi.spyOn(workspaces, 'fetchTaggableUsers').mockResolvedValueOnce([] as any);
    const opts = taggableUsersOptions('w1');
    expect(opts.queryKey).toEqual(['workspaces', 'taggableUsers', { id: 'w1' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('w1');
    spy.mockRestore();
  });
});


