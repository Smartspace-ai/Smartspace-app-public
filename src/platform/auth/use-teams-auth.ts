'use client';
import { app as teamsApp } from '@microsoft/teams-js';
import { useCallback, useState } from 'react';
import { acquireNaaToken, naaInit } from './naaClient';

export function useTeamsAuth() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError]     = useState<unknown>(null);

  const login = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      await teamsApp.initialize();
      await naaInit();
      const scopes = (import.meta.env.VITE_CLIENT_SCOPES as string | undefined)?.split(',') || [];
      await acquireNaaToken(scopes);
      // optional: redirect after login using ?redirect=
      const url = new URL(window.location.href);
      const next = url.searchParams.get('redirect') ?? '/';
      window.location.replace(next);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isLoading, error, login };
}
