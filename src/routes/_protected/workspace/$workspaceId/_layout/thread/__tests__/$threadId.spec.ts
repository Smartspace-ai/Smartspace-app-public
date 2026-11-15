import { CancelledError } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { AuthRequiredError } from '@/platform/auth/errors';

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

  it('commits the route on a server error, so the chat column shows the failure inside the page', async () => {
    // Breaks if the loader rethrows: the full-screen error page replaces the
    // sidebar and header.
    const serverError = Object.assign(
      new Error('Request failed with status 500'),
      { response: { status: 500, data: { retryable: false } } }
    );
    const ensureQueryData = vi.fn().mockRejectedValueOnce(serverError);

    const result = await Route.options.loader?.(
      makeArgs(ensureQueryData, {
        workspaceId: 'ws-1',
        threadId: 'good-thread',
      })
    );

    expect(result).toBeNull();
    expect(ensureQueryData).toHaveBeenCalledTimes(1);
  });

  it('rethrows an auth failure, so the boundary sends the user to sign in', async () => {
    // Breaks if the loader swallows it: the user is left on an inline error
    // with no way back to sign-in.
    const authFailure = new AuthRequiredError();
    const ensureQueryData = vi.fn().mockRejectedValueOnce(authFailure);

    await expect(
      Route.options.loader?.(
        makeArgs(ensureQueryData, {
          workspaceId: 'ws-1',
          threadId: 'good-thread',
        })
      )
    ).rejects.toBe(authFailure);
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
