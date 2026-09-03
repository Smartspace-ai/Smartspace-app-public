import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDictation } from '@smartspace/chat-ui';

// A minimal fake of the Speech SDK surface useDictation touches. Each
// SpeechRecognizer instance is captured so tests can fire its events.
type FakeRecognizer = {
  recognizing?: (s: unknown, e: unknown) => void;
  recognized?: (s: unknown, e: unknown) => void;
  canceled?: (s: unknown, e: unknown) => void;
  sessionStopped?: (s: unknown, e: unknown) => void;
  sessionStarted?: (s: unknown, e: unknown) => void;
  startContinuousRecognitionAsync: ReturnType<typeof vi.fn>;
  stopContinuousRecognitionAsync: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

const { recognizers, fromAuthorizationToken, state } = vi.hoisted(() => ({
  recognizers: [] as FakeRecognizer[],
  fromAuthorizationToken: vi.fn(),
  // Lets a test simulate the SDK deferring its start callback.
  state: { pendingStart: null as null | ((cb: () => void) => void) },
}));

vi.mock('microsoft-cognitiveservices-speech-sdk', () => {
  class SpeechRecognizer implements FakeRecognizer {
    recognizing?: (s: unknown, e: unknown) => void;
    recognized?: (s: unknown, e: unknown) => void;
    canceled?: (s: unknown, e: unknown) => void;
    sessionStopped?: (s: unknown, e: unknown) => void;
    sessionStarted?: (s: unknown, e: unknown) => void;
    startContinuousRecognitionAsync = vi.fn((cb: () => void) => {
      if (state.pendingStart) return state.pendingStart(cb);
      return cb();
    });
    stopContinuousRecognitionAsync = vi.fn((cb: () => void) => cb());
    close = vi.fn();
    constructor() {
      recognizers.push(this);
    }
  }
  return {
    SpeechConfig: {
      fromAuthorizationToken: fromAuthorizationToken.mockImplementation(() => ({
        speechRecognitionLanguage: '',
        setProfanity: vi.fn(),
        setProperty: vi.fn(),
      })),
    },
    AudioConfig: { fromStreamInput: vi.fn(() => ({})) },
    SpeechRecognizer,
    ProfanityOption: { Raw: 2 },
    PropertyId: { Speech_SegmentationSilenceTimeoutMs: 31 },
    ResultReason: { NoMatch: 0, RecognizedSpeech: 3 },
    CancellationReason: { Error: 0 },
    CancellationErrorCode: {
      ConnectionFailure: 3,
      AuthenticationFailure: 1,
    },
  };
});

const makeStream = () => {
  const track = { stop: vi.fn() };
  return {
    stream: { getTracks: () => [track] } as unknown as MediaStream,
    track,
  };
};

const getToken = vi.fn(async () => ({
  token: 'tok',
  expiresOn: new Date(Date.now() + 3_600_000).toISOString(),
}));

const region = 'australiaeast';

describe('useDictation', () => {
  let getUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    recognizers.length = 0;
    getUserMedia = vi.fn();
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Never let a deferred-start override leak into the next test.
    state.pendingStart = null;
  });

  it('is unavailable without a region or token provider', () => {
    const { result } = renderHook(() =>
      useDictation({ locale: 'en-NZ', onPhrase: vi.fn() })
    );
    expect(result.current.supported).toBe(true);
    expect(result.current.available).toBe(false);
  });

  it('starts, forwards final phrases (not interim), and stops cleanly', async () => {
    const { stream, track } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    const onPhrase = vi.fn();
    const onInterim = vi.fn();

    const { result } = renderHook(() =>
      useDictation({ region, locale: 'en-NZ', getToken, onPhrase, onInterim })
    );
    expect(result.current.available).toBe(true);

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.state).toBe('listening'));

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    expect(fromAuthorizationToken).toHaveBeenCalledTimes(1);
    // The token from getToken, and the region rather than the account URL: the
    // recognition path only exists on the regional host.
    expect(fromAuthorizationToken.mock.calls[0]).toEqual(['tok', region]);
    const recognizer = recognizers[0];
    expect(recognizer.startContinuousRecognitionAsync).toHaveBeenCalled();

    act(() => {
      recognizer.recognizing?.(null, { result: { text: 'hel' } });
    });
    expect(onInterim).toHaveBeenCalledWith('hel');
    expect(onPhrase).not.toHaveBeenCalled();

    act(() => {
      recognizer.recognized?.(null, {
        result: { reason: 3, text: ' hello world ' },
      });
    });
    expect(onPhrase).toHaveBeenCalledWith('hello world');
    // the guess is cleared before the real text is inserted, so the ghost never
    // renders beside the final words
    expect(onInterim).toHaveBeenLastCalledWith('');

    // NoMatch results carry no text worth inserting.
    act(() => {
      recognizer.recognized?.(null, { result: { reason: 0, text: '' } });
    });
    expect(onPhrase).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.stop();
    });
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalled();
    expect(recognizer.stopContinuousRecognitionAsync).toHaveBeenCalled();
    expect(recognizer.close).toHaveBeenCalled();

    // Anything the service flushes after the stop must not reach the editor.
    act(() => {
      recognizer.recognized?.(null, { result: { reason: 3, text: 'late' } });
      recognizer.sessionStopped?.(null, {});
    });
    expect(onPhrase).toHaveBeenCalledTimes(1);
  });

  it('maps a denied microphone permission to an error and stays idle', async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' })
    );
    const { result } = renderHook(() =>
      useDictation({ region, locale: 'en-NZ', getToken, onPhrase: vi.fn() })
    );

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBe('permission-denied');
    expect(recognizers).toHaveLength(0);
  });

  it('surfaces a service cancel as an error and releases the mic', async () => {
    const { stream, track } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    const { result } = renderHook(() =>
      useDictation({ region, locale: 'en-NZ', getToken, onPhrase: vi.fn() })
    );

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.state).toBe('listening'));

    act(() => {
      recognizers[0].canceled?.(null, {
        reason: 0,
        errorCode: 3,
        errorDetails: 'boom',
      });
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBe('network');
    expect(track.stop).toHaveBeenCalled();
  });

  it('arms as soon as the session starts, without waiting for the start promise', async () => {
    const { stream } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);

    // The real SDK does not resolve startContinuousRecognitionAsync when the mic
    // is armed — it waits on the service handshake, which it defers until audio
    // arrives. Gating "listening" on it left the button spinning until the user
    // spoke. Simulate that by never invoking the success callback.
    const neverResolves = vi.fn();
    state.pendingStart = neverResolves;

    const { result } = renderHook(() =>
      useDictation({
        region,
        locale: 'en-NZ',
        getToken,
        onPhrase: vi.fn(),
      })
    );

    await act(async () => {
      void result.current.start();
    });
    // The recogniser exists and start was invoked, but the callback never came.
    await waitFor(() => expect(recognizers).toHaveLength(1));
    expect(neverResolves).toHaveBeenCalled();
    expect(result.current.state).toBe('starting');

    // The service reports the session is up; that is what should arm the button.
    await act(async () => {
      recognizers[0].sessionStarted?.(null, {});
    });
    await waitFor(() => expect(result.current.state).toBe('listening'));

    act(() => {
      result.current.stop();
    });
  });

  it('caps the session at the token expiry when that lands before maxDurationMs', async () => {
    vi.useFakeTimers();
    try {
      const { stream } = makeStream();
      getUserMedia.mockResolvedValueOnce(stream);
      // The token is fetched once and never refreshed, so a caller raising
      // maxDurationMs past its life would otherwise die mid-utterance on an auth
      // failure. 30s of token, less the 15s margin, should stop the session at 15s
      // rather than at the 3-minute cap asked for.
      const shortToken = vi.fn(async () => ({
        token: 'tok',
        expiresOn: new Date(Date.now() + 30_000).toISOString(),
      }));

      const { result } = renderHook(() =>
        useDictation({
          region,
          locale: 'en-NZ',
          getToken: shortToken,
          onPhrase: vi.fn(),
          maxDurationMs: 180_000,
        })
      );

      await act(async () => {
        await result.current.start();
      });
      expect(result.current.state).toBe('listening');

      await act(async () => {
        vi.advanceTimersByTime(14_000);
      });
      expect(result.current.state).toBe('listening');

      await act(async () => {
        vi.advanceTimersByTime(2_000);
      });
      expect(result.current.state).toBe('idle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a permanent token failure as unavailable and does not open the mic session', async () => {
    const { stream, track } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    // SP500 = the install's speech identity is misconfigured; retrying won't help.
    const failing = vi
      .fn()
      .mockRejectedValue({ type: 'UnknownError', code: 'SP500' });

    const { result } = renderHook(() =>
      useDictation({
        region,
        locale: 'en-NZ',
        getToken: failing,
        onPhrase: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe('unavailable');
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalled();
    expect(recognizers).toHaveLength(0);
  });

  it('reports a transient token failure as retryable', async () => {
    const { stream } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    // SP503 = role assignment still propagating after a deploy.
    const failing = vi
      .fn()
      .mockRejectedValue({ type: 'UnknownError', code: 'SP503' });

    const { result } = renderHook(() =>
      useDictation({
        region,
        locale: 'en-NZ',
        getToken: failing,
        onPhrase: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe('unavailable-temporarily');
  });

  it('releases the mic on unmount', async () => {
    const { stream, track } = makeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    const { result, unmount } = renderHook(() =>
      useDictation({ region, locale: 'en-NZ', getToken, onPhrase: vi.fn() })
    );

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.state).toBe('listening'));

    unmount();

    expect(track.stop).toHaveBeenCalled();
    expect(recognizers[0].close).toHaveBeenCalled();
  });
});
