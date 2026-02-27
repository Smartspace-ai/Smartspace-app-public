import type { AuthAdapter } from '@/platform/auth/types';

export function withAuthHeaders(adapter: AuthAdapter) {
  return async (init: RequestInit = {}) => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path.startsWith('/login')) return init;
    const token = await adapter.getAccessToken({ silentOnly: true }).catch(() => undefined);
    if (!token) return init;
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    return { ...init, headers };
  };
}
