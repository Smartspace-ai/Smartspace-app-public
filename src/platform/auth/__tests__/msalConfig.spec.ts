import { describe, expect, it } from 'vitest';

import msalConfig, { apiConfig, getTeamsResource, graphConfig, handleTrailingSlash, interactiveLoginRequest, loginRequest, teamsLoginRequest } from '@/platform/auth/msalConfig';
import { isInTeams } from '@/platform/auth/utils';

describe('msalConfig', () => {
  it('handleTrailingSlash appends when missing', () => {
    expect(handleTrailingSlash('https://a')).toBe('https://a/');
    expect(handleTrailingSlash('https://a/')).toBe('https://a/');
  });

  it('isInTeams detects parent frame or query', () => {
    const orig = window.parent;
    const setSearch = (s: string) => {
      const url = new URL(window.location.href);
      Object.defineProperty(window, 'location', { value: new URL(url.toString()) });
      (window.location as any).search = s;
    };
    // query param
    setSearch('?inTeams=true');
    expect(isInTeams()).toBe(true);
    setSearch('');
    // parent check: simulate iframe by overriding parent
    Object.defineProperty(window, 'parent', { value: {} });
    expect(isInTeams()).toBe(true);
    Object.defineProperty(window, 'parent', { value: orig });
  });

  it('exports reasonable login requests', () => {
    expect(Array.isArray(loginRequest.scopes)).toBe(true);
    expect(Array.isArray(interactiveLoginRequest.scopes)).toBe(true);
    expect(Array.isArray(teamsLoginRequest.scopes)).toBe(true);
  });

  it('apiConfig and graphConfig export URIs', () => {
    expect(typeof apiConfig.chatApiUri === 'string' || apiConfig.chatApiUri == null).toBe(true);
    expect(typeof graphConfig.graphMeEndpoint).toBe('string');
    expect(typeof graphConfig.graphPhotoEndpoint).toBe('string');
  });

  it('getTeamsResource falls back to api://host/clientId when not set', () => {
    const res = getTeamsResource();
    expect(res.includes('api://')).toBe(true);
  });

  it('msalConfig has required sections', () => {
    expect(msalConfig.auth?.clientId).toBeDefined();
    expect(msalConfig.cache?.cacheLocation).toBe('localStorage');
  });
});


