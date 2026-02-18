// app/ui/RouteErrorEnvelope.tsx
import {
  ErrorComponentProps,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';

import { AuthRequiredError } from '@/platform/auth/errors';
import type { AppError } from '@/platform/envelopes';
import { normalizeRedirectPath } from '@/platform/routing/normalizeRedirectPath';

import { Envelope } from '../../shared/components/envelope';

function isAppError(e: unknown): e is AppError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'type' in (e as Record<string, unknown>)
  );
}

function isAuthError(e: unknown): boolean {
  return (
    e instanceof AuthRequiredError ||
    (isAppError(e) && e.type === 'Unauthorized')
  );
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

function getErrorMessage(error: unknown): string {
  if (isAuthError(error)) {
    return 'You are not signed in or your session expired.';
  }
  if (isAppError(error)) {
    return mapAppErrorToMessage(error);
  }
  return 'Something went wrong.';
}

export function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  const message = getErrorMessage(error);
  return <Envelope title="Oops" message={message} onRetry={reset} />;
}

export function ProtectedErrorBoundary({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!isAuthError(error)) return;

    const rawPath =
      `${location.pathname}${location.search ?? ''}${
        location.hash ?? ''
      }`.replace(/^\/login.*/, '') || '/workspace';
    const redirectTo = normalizeRedirectPath(rawPath, '/workspace');
    navigate({ to: '/login', search: { redirect: redirectTo }, replace: true });
  }, [error, location.pathname, location.search, location.hash, navigate]);

  if (isAuthError(error)) {
    return (
      <Envelope
        title="Oops"
        message="Redirecting to sign in…"
        onRetry={undefined}
      />
    );
  }

  return <RootErrorBoundary error={error} reset={reset} />;
}
