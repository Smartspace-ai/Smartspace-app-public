import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppError } from '@/platform/envelopes';

import { RootErrorBoundary } from '../RouteErrorEnvelope';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const TRACE_ID = '0af7651916cd43dd8448eb211c80319c';

describe('RootErrorBoundary trace reference', () => {
  it('shows the trace id from the problem body of a failed loader request', () => {
    // The shape the generated client rejects with: an axios error carrying
    // the API's problem body, not an AppError.
    const error = Object.assign(new Error('Request failed with status 500'), {
      response: {
        status: 500,
        data: { code: 'internal', retryable: false, traceId: TRACE_ID },
      },
    });

    render(<RootErrorBoundary error={error} reset={() => undefined} />);

    expect(screen.getByText(`Reference: ${TRACE_ID}`)).toBeTruthy();
  });

  it('shows no reference when the failed response is not a problem body', () => {
    const error = Object.assign(new Error('Request failed with status 502'), {
      response: { status: 502, data: '<html>Bad Gateway</html>' },
    });

    render(<RootErrorBoundary error={error} reset={() => undefined} />);

    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });

  it('shows the trace id of an AppError', () => {
    const error: AppError = {
      type: 'UnknownError',
      status: 500,
      traceId: TRACE_ID,
    };

    render(
      <RootErrorBoundary
        error={error as unknown as Error}
        reset={() => undefined}
      />
    );

    expect(screen.getByText(`Reference: ${TRACE_ID}`)).toBeTruthy();
  });

  it('shows no reference when the request never reached the API', () => {
    const error: AppError = { type: 'NetworkError', message: 'offline' };

    render(
      <RootErrorBoundary
        error={error as unknown as Error}
        reset={() => undefined}
      />
    );

    expect(screen.getByText(/network error occurred/)).toBeTruthy();
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });
});
