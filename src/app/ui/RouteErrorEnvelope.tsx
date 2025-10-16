// app/ui/RouteErrorEnvelope.tsx
import { ErrorComponentProps } from '@tanstack/react-router';

import type { AppError } from '@/platform/envelopes';

import { Envelope } from '../../shared/components/envelope';

function isAppError(e: unknown): e is AppError {
  return typeof e === 'object' && e !== null && 'type' in (e as Record<string, unknown>);
}

function mapAppErrorToMessage(err: AppError): string {
  switch (err.type) {
    case 'Unauthorized':
      return 'You are not signed in or your session expired.';
    case 'Forbidden':
      return 'You do not have permission to perform this action.';
    case 'NotFound':
      return 'The requested resource could not be found.';
    case 'Conflict':
      return err.message || 'There is a conflict preventing this action.';
    case 'RateLimited':
      return 'You are doing that too quickly. Please try again shortly.';
    case 'ValidationError':
      return 'Some inputs were invalid. Please check and try again.';
    case 'NetworkError':
      return 'A network error occurred. Check your connection and try again.';
    case 'UnknownError':
    default:
      return err.message || 'Something went wrong.';
  }
}

export function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  const message = isAppError(error)
    ? mapAppErrorToMessage(error)
    : 'Something went wrong.';
  return <Envelope title="Oops" message={message} onRetry={reset} />;
}

export function ProtectedErrorBoundary(props: ErrorComponentProps) {
  // Optionally add a “Back to Workspaces” action here
  return <RootErrorBoundary {...props} />;
}
