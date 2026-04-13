import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  taggableUsersOptions,
  workspaceDetailOptions,
  workspacesListOptions,
} from '@/domains/workspaces/queries';
import * as workspacesService from '@/domains/workspaces/service';

import { createFakeChatService } from '@/test/chatProviderHarness';

describe('workspaces queries options', () => {
  it('workspacesListOptions composes key and calls service', async () => {
    // workspacesListOptions still uses the legacy direct-service path since
    // the list endpoint is not part of the chat UI surface.
    const spy = vi
      .spyOn(workspacesService, 'fetchWorkspaces')
      .mockResolvedValueOnce([] as any);
    const opts = workspacesListOptions('abc');
    expect(opts.queryKey).toEqual(['workspaces', 'list', 'abc']);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(spy).toHaveBeenCalledWith('abc');
    spy.mockRestore();
  });

  it('workspaceDetailOptions composes key and calls injected service', async () => {
    const fetchWorkspace = vi.fn().mockResolvedValueOnce({ id: 'w1' });
    const service = createFakeChatService({ fetchWorkspace });
    const opts = workspaceDetailOptions(service, 'w1');
    expect(opts.queryKey).toEqual(['workspaces', 'byId', 'w1']);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(fetchWorkspace).toHaveBeenCalledWith('w1');
  });

  it('taggableUsersOptions composes key and calls injected service', async () => {
    const fetchTaggableUsers = vi.fn().mockResolvedValueOnce([]);
    const service = createFakeChatService({ fetchTaggableUsers });
    const opts = taggableUsersOptions(service, 'w1');
    expect(opts.queryKey).toEqual(['workspaces', 'taggableUsers', 'w1']);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(fetchTaggableUsers).toHaveBeenCalledWith('w1');
  });
});
