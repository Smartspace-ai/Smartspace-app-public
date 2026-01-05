import { describe, expect, it } from 'vitest';

import msalConfig, { apiConfig, getTeamsResource, graphConfig, handleTrailingSlash, interactiveLoginRequest, loginRequest, teamsLoginRequest } from '@/platform/auth/msalConfig';
import { isInTeams } from '@/platform/auth/utils';

describe('msalConfig', () => {
  it('handleTrailingSlash appends when missing', () => {
    expect(handleTrailingSlash('https://a')).toBe('https://a/');
    expect(handleTrailingSlash('https://a/')).toBe('https://a/');
  });

  it('isInTeams is false by default in tests (mocked in setup)', () => {
    expect(isInTeams()).toBe(false);
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


