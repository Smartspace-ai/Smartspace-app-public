// app/ui/RouteErrorEnvelope.tsx
import { ErrorComponentProps, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { AuthRequiredError } from '@/platform/auth/errors';
import { isInTeams } from '@/platform/auth/msalConfig';
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

function isHttp401(e: unknown): boolean {
  if (!e || typeof e !== 'object' || !('response' in e)) return false;
  const res = (e as { response?: { status?: number } }).response;
  return res?.status === 401;
}

function isAuthError(e: unknown): boolean {
  return (
    e instanceof AuthRequiredError ||
    (isAppError(e) && e.type === 'Unauthorized') ||
    isHttp401(e)
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

function getErrorDetail(error: unknown): string | null {
  if (!isInTeams()) return null;
  try {
    const parts: string[] = [];
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);
    if (name) parts.push(name);
    if (message) parts.push(message);

    // Extract Axios request details when available
    if (error && typeof error === 'object' && 'config' in error) {
      const config = (error as Record<string, unknown>).config as
        | Record<string, unknown>
        | undefined;
      if (config) {
        parts.push(
          `URL: ${String(config.baseURL ?? '')}${String(config.url ?? '')}`
        );
        parts.push(
          `Method: ${String(config.method ?? 'unknown').toUpperCase()}`
        );
        const headers = config.headers as Record<string, unknown> | undefined;
        parts.push(`Has Auth: ${!!headers?.Authorization}`);
      }
    }

    const stack = error instanceof Error ? error.stack : undefined;
    if (stack) parts.push(stack);
    return parts.length > 0 ? parts.join('\n') : null;
  } catch {
    return null;
  }
}

function getRedirectPath(): string {
  if (typeof window === 'undefined') return '/workspace';
  const raw =
    `${window.location.pathname}${window.location.search}${window.location.hash}`.replace(
      /^\/login.*/,
      ''
    ) || '/workspace';
  return normalizeRedirectPath(raw, '/workspace');
}

function goToLogin(navigate: ReturnType<typeof useNavigate>) {
  const redirectTo = getRedirectPath();
  navigate({ to: '/login', search: { redirect: redirectTo }, replace: true });
}

export function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();
  const message = getErrorMessage(error);
  const authError = isAuthError(error);
  const detail = getErrorDetail(error);

  return (
    <>
      <Envelope
        title="Oops"
        message={message}
        onRetry={authError ? undefined : reset}
        onSignIn={authError ? () => goToLogin(navigate) : undefined}
      />
      {detail ? (
        <pre className="mx-auto mt-2 max-w-lg whitespace-pre-wrap break-words text-xs text-red-800/80 p-3 bg-red-50 rounded border border-red-200 overflow-auto max-h-60">
          {detail}
        </pre>
      ) : null}
    </>
  );
}

export function ProtectedErrorBoundary({ error, reset }: ErrorComponentProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthError(error)) return;
    goToLogin(navigate);
  }, [error, navigate]);

  if (isAuthError(error)) {
    return (
      <Envelope
        title="Oops"
        message="You are not signed in or your session expired."
        onSignIn={() => goToLogin(navigate)}
      />
    );
  }

  return <RootErrorBoundary error={error} reset={reset} />;
}
