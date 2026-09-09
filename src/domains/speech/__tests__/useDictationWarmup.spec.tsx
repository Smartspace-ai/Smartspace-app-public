import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDictation } from '@smartspace/chat-ui';

// Evaluation marker: the mock factory runs when the SDK module is first
// imported in this file's module graph. Nothing else in this file imports it,
// so the count observes exactly the hook's background warm-up. Lives in its
// own spec file because the sibling spec imports the SDK on the click path,
// which would consume the first evaluation and blind this observation.
const { evals } = vi.hoisted(() => ({ evals: { count: 0 } }));

vi.mock('microsoft-cognitiveservices-speech-sdk', () => {
  evals.count += 1;
  return {};
});

const getToken = vi.fn(async () => ({
  token: 'tok',
  expiresOn: new Date(Date.now() + 600_000).toISOString(),
}));

describe('useDictation SDK warm-up', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    });
  });

  it('loads the SDK once dictation is available — and not before', async () => {
    // Unavailable (no region): the fallback timer window passes with no load.
    // jsdom has no requestIdleCallback, so the warm goes down the 1.5s timer.
    renderHook(() =>
      useDictation({ locale: 'en-NZ', getToken, onPhrase: vi.fn() })
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1_700));
    });
    expect(evals.count).toBe(0);

    // Available: the SDK loads with no click.
    renderHook(() =>
      useDictation({
        region: 'australiaeast',
        locale: 'en-NZ',
        getToken,
        onPhrase: vi.fn(),
      })
    );
    await waitFor(() => expect(evals.count).toBe(1), { timeout: 3_000 });
  });
});
