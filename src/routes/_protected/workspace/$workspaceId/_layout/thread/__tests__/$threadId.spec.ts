import { CancelledError, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AuthRequiredError } from '@/platform/auth/errors';

import { server } from '@/test/mocks/server';
import { threadsKeys } from '@smartspace/chat-ui';

import { Route } from '../$threadId';

type LoaderArgs = Parameters<
  NonNullable<(typeof Route)['options']['loader']>
>[0];

function makeArgs(
  ensureQueryData: ReturnType<typeof vi.fn>,
  params: { workspaceId: string; threadId: string }
): LoaderArgs {
  return {
    params,
    context: { queryClient: { ensureQueryData } },
  } as unknown as LoaderArgs;
}

describe('$threadId route loader — cancellation vs not-found', () => {
  it('returns null instead of redirecting when the thread detail fetch is cancelled', async () => {
    // Simulates a pin/rename mutation elsewhere cancelling threadsKeys.details()
    // while this thread's own (perfectly valid) detail fetch is in flight.
    const ensureQueryData = vi.fn().mockRejectedValueOnce(new CancelledError());

    const result = await Route.options.loader?.(
      makeArgs(ensureQueryData, {
        workspaceId: 'ws-1',
        threadId: 'good-thread',
      })
    );

    expect(result).toBeNull();
    // Only the detail fetch should have been attempted — no list re-check,
    // and critically no redirect thrown away from a thread that's fine.
    expect(ensureQueryData).toHaveBeenCalledTimes(1);
  });

  it('still redirects to a different thread on a genuine 404', async () => {
    const ensureQueryData = vi
      .fn()
      .mockRejectedValueOnce({ type: 'NotFound' })
      .mockResolvedValueOnce({ data: [{ id: 'other-thread' }], total: 1 });

    await expect(
      Route.options.loader?.(
        makeArgs(ensureQueryData, {
          workspaceId: 'ws-1',
          threadId: 'gone-thread',
        })
      )
    ).rejects.toMatchObject({
      options: {
        params: { workspaceId: 'ws-1', threadId: 'other-thread' },
        replace: true,
      },
    });
  });

  it.each([
    ['a 5xx', { isAxiosError: true, response: { status: 500, data: {} } }],
    ['a network failure', { isAxiosError: true, message: 'Network Error' }],
  ])(
    'commits the route on %s, so the chat column shows the failure inside the page',
    async (_name, failure) => {
      // Breaks if the loader rethrows: the full-screen error page replaces
      // the sidebar and header.
      const ensureQueryData = vi.fn().mockRejectedValueOnce(failure);

      const result = await Route.options.loader?.(
        makeArgs(ensureQueryData, {
          workspaceId: 'ws-1',
          threadId: 'good-thread',
        })
      );

      expect(result).toBeNull();
      expect(ensureQueryData).toHaveBeenCalledTimes(1);
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
        Route.options.loader?.(
          makeArgs(ensureQueryData, {
            workspaceId: 'ws-1',
            threadId: 'good-thread',
          })
        )
      ).rejects.toBe(failure);
    }
  );

  it('commits on a real 503 from the API, leaving the failed query for the chat column', async () => {
    // Starts from the error the generated client really throws, not a
    // hand-built shape.
    server.use(
      http.get('*/workspaces/:workspaceId/messagethreads/:threadId', () =>
        HttpResponse.json({ code: 'unavailable' }, { status: 503 })
      )
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(
      Route.options.loader?.({
        params: { workspaceId: 'ws-1', threadId: 'good-thread' },
        context: { queryClient },
      } as unknown as LoaderArgs)
    ).resolves.toBeNull();
    expect(
      queryClient.getQueryState(threadsKeys.detail('ws-1', 'good-thread'))
        ?.status
    ).toBe('error');
  });

  it('returns null instead of redirecting when the 404-recovery list re-check is itself cancelled', async () => {
    const ensureQueryData = vi
      .fn()
      .mockRejectedValueOnce({ type: 'NotFound' })
      .mockRejectedValueOnce(new CancelledError());

    const result = await Route.options.loader?.(
      makeArgs(ensureQueryData, {
        workspaceId: 'ws-1',
        threadId: 'gone-thread',
      })
    );

    expect(result).toBeNull();
  });
});
