import { describe, expect, it, vi } from 'vitest';

import { AuthRequiredError } from '@/platform/auth/errors';

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
  it('commits the layout on a server error, so the header shows the failure and the sidebar stays', async () => {
    // Breaks if the loader rethrows: the full-screen error page replaces the
    // whole workspace.
    const serverError = Object.assign(
      new Error('Request failed with status 500'),
      { response: { status: 500, data: { retryable: false } } }
    );
    const ensureQueryData = vi.fn().mockRejectedValueOnce(serverError);

    await expect(
      Route.options.loader?.(makeArgs(ensureQueryData))
    ).resolves.toBeNull();
  });

  it('rethrows an auth failure, so the boundary sends the user to sign in', async () => {
    const authFailure = new AuthRequiredError();
    const ensureQueryData = vi.fn().mockRejectedValueOnce(authFailure);

    await expect(
      Route.options.loader?.(makeArgs(ensureQueryData))
    ).rejects.toBe(authFailure);
  });

  it('still sends a workspace the user can no longer see back to /workspace', async () => {
    // Unchanged behaviour, pinned here because the same catch now has a
    // third branch.
    const ensureQueryData = vi.fn().mockRejectedValueOnce({ type: 'NotFound' });

    await expect(
      Route.options.loader?.(makeArgs(ensureQueryData))
    ).rejects.toMatchObject({ options: { to: '/workspace', replace: true } });
  });
});
