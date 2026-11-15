import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AuthRequiredError } from '@/platform/auth/errors';

import { server } from '@/test/mocks/server';
import { workspaceKeys } from '@smartspace/chat-ui';

import { Route } from '../_layout';

type LoaderArgs = Parameters<
  NonNullable<(typeof Route)['options']['loader']>
>[0];

function makeArgs(ensureQueryData: ReturnType<typeof vi.fn>): LoaderArgs {
  return {
    params: { workspaceId: 'ws-1' },
    context: { queryClient: { ensureQueryData } },
  } as unknown as LoaderArgs;
}

describe('workspace layout loader', () => {
  it.each([
    ['a 5xx', { isAxiosError: true, response: { status: 500, data: {} } }],
    ['a network failure', { isAxiosError: true, message: 'Network Error' }],
  ])(
    'commits the layout on %s, so the header shows the failure and the sidebar stays',
    async (_name, failure) => {
      // Breaks if the loader rethrows: the full-screen error page replaces
      // the whole workspace.
      const ensureQueryData = vi.fn().mockRejectedValueOnce(failure);

      await expect(
        Route.options.loader?.(makeArgs(ensureQueryData))
      ).resolves.toBeNull();
    }
  );

  it.each([
    ['an AuthRequiredError', new AuthRequiredError()],
    ['a raw 401', { isAxiosError: true, response: { status: 401, data: {} } }],
    ['an Unauthorized AppError', { type: 'Unauthorized' }],
    ['a 403', { isAxiosError: true, response: { status: 403, data: {} } }],
    ['a response that fails validation', { type: 'ValidationError' }],
  ])(
    'rethrows %s, so the boundary handles what trying again cannot fix',
    async (_name, failure) => {
      // Breaks if the loader swallows it: the user gets an inline Try again
      // that can never succeed, or is never sent to sign in.
      const ensureQueryData = vi.fn().mockRejectedValueOnce(failure);

      await expect(
        Route.options.loader?.(makeArgs(ensureQueryData))
      ).rejects.toBe(failure);
    }
  );

  it('commits on a real 503 from the API, leaving the failed query for the header', async () => {
    // Starts from the error the generated client really throws, not a
    // hand-built shape.
    server.use(
      http.get('*/workspaces/:workspaceId', () =>
        HttpResponse.json({ code: 'unavailable' }, { status: 503 })
      )
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(
      Route.options.loader?.({
        params: { workspaceId: 'ws-1' },
        context: { queryClient },
      } as unknown as LoaderArgs)
    ).resolves.toBeNull();
    expect(queryClient.getQueryState(workspaceKeys.byId('ws-1'))?.status).toBe(
      'error'
    );
  });

  it('still sends a workspace the user can no longer see back to /workspace', async () => {
    const ensureQueryData = vi.fn().mockRejectedValueOnce({ type: 'NotFound' });

    await expect(
      Route.options.loader?.(makeArgs(ensureQueryData))
    ).rejects.toMatchObject({ options: { to: '/workspace', replace: true } });
  });
});
