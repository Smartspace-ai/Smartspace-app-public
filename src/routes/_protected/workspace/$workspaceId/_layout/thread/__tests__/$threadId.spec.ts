import { CancelledError } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

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
