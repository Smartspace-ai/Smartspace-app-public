// Auth
export { createAuthAdapter, type AdapterMode } from './auth';
export { AuthProvider, useAuth, useUserId } from './auth/session';

// Network
export { api } from './api'; // typed wrapper: returns data, throws AppError
export { request, requestOrThrow, unwrap } from './request';

// Errors / retry
export { isTransient } from './envelopes';
export type { AppError, Result } from './envelopes';

// React Query
export { queryClient } from './reactQueryClient';

// ⛔ do NOT export './transport' (raw Axios)
