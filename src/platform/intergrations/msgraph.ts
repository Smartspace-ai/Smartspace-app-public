// src/platform/integrations/msgraph.ts
import { msalInstance } from '@/platform/auth/msalClient';
import { acquireNaaToken } from '@/platform/auth/naaClient';
import { isInTeams } from '@/platform/auth/utils';

// Reasonable defaults; override per-call if needed
const DEFAULT_SCOPES = ['User.Read']; // add others as needed

async function getGraphToken(scopes: string[] = DEFAULT_SCOPES): Promise<string> {
  if (isInTeams()) {
    return acquireNaaToken(scopes, { silentOnly: true });
  }
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) throw new Error('No active account for Graph token');
  const res = await msalInstance.acquireTokenSilent({ scopes, account });
  return res.accessToken;
}

function graphBase(): string {
  // v1.0 for stable; switch to /beta per endpoint if you need
  return 'https://graph.microsoft.com/v1.0';
}

type GraphInit = Omit<RequestInit, 'headers'> & {
  scopes?: string[];
  headers?: Record<string, string>;
};

export async function graphGetJSON<T>(path: string, init: GraphInit = {}): Promise<T | null> {
  const token = await getGraphToken(init.scopes);
  const res = await fetch(graphBase() + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`Graph ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function graphGetBlob(path: string, init: GraphInit = {}): Promise<Blob | null> {
  const token = await getGraphToken(init.scopes);
  const res = await fetch(graphBase() + path, {
    ...init,
    headers: {
      Accept: 'image/jpeg',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`Graph ${res.status}: ${body}`);
  }
  return res.blob();
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return '<no body>'; }
}

// Optional convenience APIs:
export const graph = {
  me: () => graphGetJSON<{ id: string; displayName: string }>('/me'),
  mePhoto: () => graphGetBlob('/me/photo/$value'),
};
