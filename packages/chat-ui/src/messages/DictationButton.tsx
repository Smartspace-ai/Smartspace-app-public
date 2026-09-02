import IconButton from '@mui/material/IconButton';
import { Mic, Square } from 'lucide-react';

import type {
  DictationError,
  DictationState,
} from '@/shared/speech/useDictation';

export const dictationErrorMessages: Record<DictationError, string> = {
  'permission-denied':
    'Microphone access is blocked — allow it in your browser settings and try again',
  'no-microphone': 'No microphone was found',
  network: 'Could not reach the speech service — try again',
  'unavailable-temporarily': 'Dictation is starting up — try again in a moment',
  unavailable: 'Dictation is not available on this workspace',
  unknown: 'Dictation stopped unexpectedly — try again',
};

export type DictationButtonProps = {
  state: DictationState;
  error: DictationError | null;
  disabled?: boolean;
  onToggle: () => void;
  /** Icon/button sizing to match the surrounding toolbar. */
  size?: 'sm' | 'md';
};

/**
 * The composer's microphone, which carries the dictation state itself rather than
 * relying on text elsewhere: a spinning ring while the session is starting, and a
 * filled stop square while it is listening — the same shape Send takes during a
 * run, because the button's job is the same at that point. The transcript appears
 * in the composer at the caret, so nothing is reported in two places.
 */
export function DictationButton({
  state,
  error,
  disabled,
  onToggle,
  size = 'sm',
}: DictationButtonProps) {
  const listening = state === 'listening';
  const starting = state === 'starting';
  const label = listening ? 'Stop dictation' : 'Dictate a message';
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <IconButton
      type="button"
      onClick={onToggle}
      // Deliberately NOT disabled while starting: taking focus away from a
      // control the user just activated strands keyboard users, and cancelling a
      // slow start is a reasonable thing to want.
      disabled={disabled}
      aria-pressed={listening}
      aria-label={label}
      title={error ? dictationErrorMessages[error] : label}
      className={`relative ${dims} rounded-full transition-colors ${
        listening
          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          : 'text-muted-foreground hover:bg-secondary'
      }`}
    >
      {/* Starting: a ring sweeping around the mic. Purely decorative — the
          accessible state lives in aria-pressed and the composer's live region. */}
      {starting && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current opacity-70"
        />
      )}
      {/* Listening: a soft halo so the filled button reads as active rather than
          merely selected. */}
      {listening && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-destructive/30"
        />
      )}
      {/* While listening the icon becomes a stop square, matching how Send turns
          into one during a run — the button's job has changed from "start
          dictating" to "stop", and it should look like every other stop here. */}
      {listening ? (
        <Square className={`relative ${icon} fill-current`} />
      ) : (
        <Mic className={`relative ${icon}`} />
      )}
    </IconButton>
  );
}
