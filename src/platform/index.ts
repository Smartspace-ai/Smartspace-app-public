// Auth
export { getAuthAdapter, createAuthAdapter } from './auth';
export { AuthProvider, useAuth, useUserId } from './auth/session';
export { sessionQueryOptions, SESSION_QUERY_KEY } from './auth/sessionQuery';

// Network
export { api } from './api'; // typed wrapper: returns data, throws AppError
export { request, requestOrThrow, unwrap } from './request';

// Errors / retry
export { isTransient } from './envelopes';
export type { AppError, Result } from './envelopes';

// React Query
export { queryClient } from './reactQueryClient';

// ⛔ do NOT export './transport' (raw Axios)
