import IconButton from '@mui/material/IconButton';
import { Mic } from 'lucide-react';

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
 * The composer's microphone. Toggles a dictation session; pulses while
 * listening; explains the last failure in its tooltip.
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
      disabled={disabled || starting}
      aria-pressed={listening}
      aria-label={label}
      title={error ? dictationErrorMessages[error] : label}
      className={`${dims} rounded-full ${
        listening
          ? 'text-destructive ring-2 ring-destructive/40 animate-pulse'
          : 'text-muted-foreground hover:bg-secondary'
      } ${starting ? 'opacity-60' : ''}`}
    >
      <Mic className={icon} />
    </IconButton>
  );
}
