import { CancelledError } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { Route } from '../index';

type LoaderArgs = Parameters<
  NonNullable<(typeof Route)['options']['loader']>
>[0];

function makeArgs(
  ensureQueryData: ReturnType<typeof vi.fn>,
  params: { workspaceId: string }
): LoaderArgs {
  return {
    params,
    context: { queryClient: { ensureQueryData } },
  } as unknown as LoaderArgs;
}

describe('workspace index route loader — cancellation', () => {
  it('returns null instead of throwing when the thread list fetch is cancelled', async () => {
    // A pin/rename/delete mutation elsewhere can cancel this exact fetch via
    // its own onMutate cancelling threadsKeys.lists() — that's not evidence
    // the workspace is empty, so this must not crash into the error boundary.
    const ensureQueryData = vi.fn().mockRejectedValueOnce(new CancelledError());

    const result = await Route.options.loader?.(
      makeArgs(ensureQueryData, { workspaceId: 'ws-1' })
    );

    expect(result).toBeNull();
  });
});
