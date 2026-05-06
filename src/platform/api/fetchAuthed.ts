// Authenticated fetch against the chat API. Centralizes the baseUrl
// normalisation + bearer-token retrieval + Authorization-header wiring that
// every raw-fetch caller in this codebase used to repeat. Used by the
// streaming endpoints the SDK doesn't expose (`/Messages/start`,
// `/Messages/{id}/values`, `/MessageThreads/{id}/messages/stream`); SDK
// methods stay the preferred path for non-streaming endpoints.
//
// Returns the raw `Response` — callers choose how to consume the body
// (`.json()` for plain endpoints, `.body` for SSE) and own their non-2xx
// error message wording. The helper deliberately doesn't throw on bad
// status because `streamThreadMessages` treats 404 as a return value, not
// an error.
import { AXIOS_INSTANCE } from '@smartspace/api-client';

import { getAuthAdapter } from '@/platform/auth';
import { getApiScopes } from '@/platform/auth/scopes';

export type FetchAuthedInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function fetchAuthed(
  endpoint: string,
  init: FetchAuthedInit = {}
): Promise<Response> {
  const baseUrl = (AXIOS_INSTANCE.defaults.baseURL ?? '').replace(/\/$/, '');
  const token = await getAuthAdapter().getAccessToken({
    silentOnly: true,
    scopes: getApiScopes(),
  });
  const url = `${baseUrl}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}
