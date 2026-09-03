import { useCallback, useEffect, useRef, useState } from 'react';

import type { SpeechToken } from '@/domains/speech/model';

type SpeechSdk = typeof import('microsoft-cognitiveservices-speech-sdk');

export type DictationState = 'idle' | 'starting' | 'listening';

export type DictationError =
  | 'permission-denied'
  | 'no-microphone'
  | 'network'
  /** Worth another go: the install is fine, this attempt wasn't. */
  | 'unavailable-temporarily'
  /** Don't keep asking: this install can't do dictation. */
  | 'unavailable'
  | 'unknown';

type Session = {
  recognizer: InstanceType<SpeechSdk['SpeechRecognizer']>;
  stream: MediaStream;
  timers: { idle?: number; max?: number };
};

export type UseDictationOptions = {
  /** Azure region from `SpeechConfig`; dictation is unavailable without it. */
  region?: string | null;
  /** BCP-47 recognition locale (server default unless the user chose one). */
  locale: string;
  /** From the ChatService; dictation is unavailable without it. */
  getToken?: () => Promise<SpeechToken>;
  /** A final recognised phrase — insert it into the editor. */
  onPhrase: (text: string) => void;
  /**
   * Provisional text, revised several times a second. Rendered as greyed ghost
   * text at the caret. Deliberately a callback rather than hook state: holding it
   * in state would re-render the whole composer on every partial result.
   */
  onInterim?: (text: string) => void;
  /**
   * Hard stop, so a forgotten mic can't run for an hour. Keep it under the
   * token's ~10 minute life: the token is fetched once per session and never
   * refreshed, so a longer cap would end the session on an auth failure.
   */
  maxDurationMs?: number;
  /** Stop after this long without any speech. */
  idleTimeoutMs?: number;
};

/** Stop this far short of the token's expiry rather than dying mid-word. */
const TOKEN_EXPIRY_MARGIN_MS = 15_000;

const isSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  !!navigator.mediaDevices?.getUserMedia;

/**
 * The API answers a failed token mint with a code, because 5xx bodies are scrubbed
 * of everything else: SP503 is transient (usually a role assignment still
 * propagating after a deploy), SP500 means the install is misconfigured. Anything
 * else we treat as worth retrying, since the common causes — a dropped request, a
 * gateway blip — are.
 */
function classifyTokenFailure(error: unknown): DictationError {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === 'SP500') return 'unavailable';
  if ((error as { type?: unknown } | null)?.type === 'NotFound') {
    return 'unavailable';
  }
  return 'unavailable-temporarily';
}

/**
 * Streams microphone audio to Azure AI Speech and hands back recognised
 * phrases. Owns the whole session: mic permission + stream, lazy SDK load,
 * recogniser lifecycle, idle/max timers, and teardown on stop or unmount.
 * Interim (not yet final) text goes to `onInterim` for display only; only final
 * phrases reach `onPhrase`.
 */
export function useDictation({
  region,
  locale,
  getToken,
  onPhrase,
  onInterim,
  maxDurationMs = 180_000,
  idleTimeoutMs = 20_000,
}: UseDictationOptions) {
  const [state, setState] = useState<DictationState>('idle');
  const [error, setError] = useState<DictationError | null>(null);

  const sessionRef = useRef<Session | null>(null);
  // Bumped by every start/stop; an in-flight start that sees a different
  // generation after an await was superseded (stopped or unmounted) and must
  // clean up after itself instead of publishing a session.
  const generationRef = useRef(0);
  const onPhraseRef = useRef(onPhrase);
  const onInterimRef = useRef(onInterim);
  useEffect(() => {
    onPhraseRef.current = onPhrase;
    onInterimRef.current = onInterim;
  });
  const clearInterim = useCallback(() => onInterimRef.current?.(''), []);

  const supported = isSupported();
  const available = supported && !!region && !!getToken;

  const stop = useCallback(() => {
    generationRef.current += 1;
    const session = sessionRef.current;
    sessionRef.current = null;
    clearInterim();
    setState('idle');
    // Deliberately does NOT clear `error`: a real failure arrives as `canceled`
    // and then calls straight through to here, so clearing would erase the very
    // error we need to show. `start` clears it instead, so a message persists
    // until the user tries again. The spurious `canceled` our own teardown
    // provokes is handled by the isLive() gate, not by clearing.
    if (!session) return;
    window.clearTimeout(session.timers.idle);
    window.clearTimeout(session.timers.max);
    // Stopping the tracks first turns the browser's mic indicator off at once
    // rather than after the service acknowledges the stop. The service reacts to
    // the closed stream by firing `canceled`, which is why every handler below
    // checks it is still the live session before touching state.
    session.stream.getTracks().forEach((t) => t.stop());
    session.recognizer.stopContinuousRecognitionAsync(
      () => session.recognizer.close(),
      () => session.recognizer.close()
    );
  }, [clearInterim]);

  const start = useCallback(async () => {
    if (!available || sessionRef.current) return;
    const generation = ++generationRef.current;
    const superseded = () => generationRef.current !== generation;

    setError(null);
    setState('starting');

    // Ask for the mic ourselves rather than via the SDK so permission failures
    // are ours to explain and we hold the tracks to stop them promptly.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      if (superseded()) return;
      const name = (e as DOMException | undefined)?.name;
      setError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'permission-denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
          ? 'no-microphone'
          : 'unknown'
      );
      setState('idle');
      return;
    }
    if (superseded()) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    // Fetch the token up front rather than letting the SDK pull it mid-connect:
    // a failure here keeps its own error code, where inside the SDK it would only
    // ever reach us as an opaque cancellation.
    let token: SpeechToken;
    try {
      token = await (getToken as () => Promise<SpeechToken>)();
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      if (superseded()) return;
      setError(classifyTokenFailure(e));
      setState('idle');
      return;
    }
    if (superseded()) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    let recognizer: Session['recognizer'] | null = null;
    // Tracked out here so the catch can retract a session it already published.
    let published: Session | null = null;
    try {
      // The SDK is large; only users who press the mic pay for it.
      const sdk: SpeechSdk = await import(
        'microsoft-cognitiveservices-speech-sdk'
      );
      if (superseded()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // A token from the resource's own /sts/v1.0/issueToken, not an Entra one:
      // it expires in ~10 minutes and only works for recognition in this region.
      // It has to go to the regional host — the custom-domain URL answers 404 on
      // the recognition path — which is what `fromAuthorizationToken` builds.
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        token.token,
        region as string
      );
      speechConfig.speechRecognitionLanguage = locale;
      // It's the user's own words; don't asterisk them.
      speechConfig.setProfanity(sdk.ProfanityOption.Raw);
      // Finalise phrases at natural pauses so text lands while they're still
      // talking, rather than one long result at the end.
      speechConfig.setProperty(
        sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
        '700'
      );

      recognizer = new sdk.SpeechRecognizer(
        speechConfig,
        sdk.AudioConfig.fromStreamInput(stream)
      );

      // The token is fetched once and never refreshed, so the session must not outlive
      // it. `maxDurationMs` is a caller-supplied option, so the cap is enforced here
      // rather than left to the default happening to be short enough. An expiry we
      // can't read falls back to the option and lets the service report the failure.
      const untilExpiry =
        Date.parse(token.expiresOn) - Date.now() - TOKEN_EXPIRY_MARGIN_MS;
      const sessionCapMs =
        Number.isFinite(untilExpiry) && untilExpiry > 0
          ? Math.min(maxDurationMs, untilExpiry)
          : maxDurationMs;

      const session: Session = { recognizer, stream, timers: {} };
      const armIdle = () => {
        window.clearTimeout(session.timers.idle);
        session.timers.idle = window.setTimeout(stop, idleTimeoutMs);
      };
      // The service keeps delivering for a moment after a stop (a final phrase
      // for buffered audio, then sessionStopped). Once this session is no longer
      // the live one those events must not touch state — in particular a late
      // phrase must not land in the editor after Send has cleared it, a late
      // sessionStopped must not tear down a newer session, and the `canceled`
      // that our own teardown provokes must not paint an error.
      const isLive = () => sessionRef.current === session;

      // Publish the session before starting, so the SDK's own lifecycle events
      // can drive state. `startContinuousRecognitionAsync` does not resolve when
      // the microphone is armed — it waits on the service handshake, which the
      // SDK defers until audio actually arrives. Gating "listening" on it meant
      // the button span until the user spoke, which is backwards: the moment you
      // most need to know it is ready is before you say anything.
      sessionRef.current = session;
      published = session;

      const goLive = () => {
        if (!isLive()) return;
        session.timers.max ??= window.setTimeout(stop, sessionCapMs);
        armIdle();
        setState('listening');
      };

      // The service's own signal that the session is up.
      recognizer.sessionStarted = () => goLive();

      recognizer.recognizing = (_sender, event) => {
        if (!isLive()) return;
        onInterimRef.current?.(event.result.text ?? '');
        armIdle();
      };
      recognizer.recognized = (_sender, event) => {
        if (!isLive()) return;
        const text = event.result.text?.trim();
        // Clear the guess before inserting the real text, so the ghost never
        // renders alongside the final words it was guessing at.
        clearInterim();
        if (event.result.reason === sdk.ResultReason.RecognizedSpeech && text) {
          onPhraseRef.current(text);
        }
        armIdle();
      };
      recognizer.canceled = (_sender, event) => {
        if (!isLive()) return;
        if (event.reason === sdk.CancellationReason.Error) {
          // errorCode only: errorDetails is free text from the service and is the
          // one sink near the credential whose contents we don't control.
          console.warn('[dictation] cancelled, errorCode:', event.errorCode);
          setError(
            event.errorCode === sdk.CancellationErrorCode.ConnectionFailure
              ? 'network'
              : event.errorCode ===
                sdk.CancellationErrorCode.AuthenticationFailure
              ? 'unavailable-temporarily'
              : 'unknown'
          );
        }
        stop();
      };
      recognizer.sessionStopped = () => {
        if (isLive()) stop();
      };

      // Open the socket up front rather than letting the SDK do it lazily on the
      // first audio. It arms the mic sooner and takes the connection handshake
      // off the path to the first word.
      try {
        const connection = sdk.Connection.fromRecognizer(recognizer);
        connection.connected = () => goLive();
        connection.openConnection();
      } catch {
        /* pre-connect is an optimisation; recognition still starts without it */
      }

      await new Promise<void>((resolve, reject) =>
        session.recognizer.startContinuousRecognitionAsync(resolve, reject)
      );
      // Fallback: if neither `connected` nor `sessionStarted` reached us, the
      // recogniser is running regardless by the time this resolves.
      goLive();
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      try {
        recognizer?.close();
      } catch {
        /* already closed by stop() */
      }
      if (published) {
        // If the throw landed after goLive() armed these, they outlive the
        // session: stop() is the only other thing that clears them and it bails
        // once sessionRef is null, so an orphan would later tear down whichever
        // session happens to be live by then.
        window.clearTimeout(published.timers.idle);
        window.clearTimeout(published.timers.max);
        if (sessionRef.current === published) sessionRef.current = null;
      }
      if (superseded()) return;
      console.warn('[dictation] failed to start:', e);
      // A `canceled` event during start-up already named the cause; keep it.
      setError((prev) => prev ?? 'unavailable-temporarily');
      setState('idle');
    }
  }, [
    available,
    clearInterim,
    getToken,
    idleTimeoutMs,
    locale,
    maxDurationMs,
    region,
    stop,
  ]);

  // Unmount → release the mic and the service connection. `stop` is stable, so
  // this runs on unmount only; keep it that way if you ever give `stop` deps.
  useEffect(() => stop, [stop]);

  const toggle = useCallback(() => {
    // Anything that isn't idle stops, `starting` included. If no signal ever
    // arrives — neither sessionStarted, nor the connection, nor the start
    // callback — the hook would otherwise sit in `starting` with the microphone
    // open and no way to release it. The button stays enabled during start-up
    // for exactly this reason.
    if (state === 'idle') void start();
    else stop();
  }, [start, state, stop]);

  return { supported, available, state, error, start, stop, toggle };
}
