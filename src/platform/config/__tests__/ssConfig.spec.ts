import { afterEach, describe, expect, it } from 'vitest';

import { missingSsConfigKeys, ssConfig } from '@/platform/config/ssConfig';

const win = window as unknown as { ssconfig?: Record<string, unknown> };

describe('ssConfig', () => {
  afterEach(() => {
    delete win.ssconfig;
  });

  it('returns the trimmed value of the key asked for', () => {
    win.ssconfig = { Client_Id: '  client-1  ', Chat_Api_Uri: 'https://api' };

    expect(ssConfig('Client_Id')).toBe('client-1');
    expect(ssConfig('Chat_Api_Uri')).toBe('https://api');
  });

  it('returns undefined when the key is unset, empty or not a string', () => {
    expect(ssConfig('Client_Id')).toBeUndefined();

    win.ssconfig = { Client_Id: '   ', Client_Scopes: 42, Chat_Api_Uri: null };

    expect(ssConfig('Client_Id')).toBeUndefined();
    expect(ssConfig('Client_Scopes')).toBeUndefined();
    expect(ssConfig('Chat_Api_Uri')).toBeUndefined();
    expect(ssConfig('Tenant_Id')).toBeUndefined();
  });

  it('reads a boolean Teams_Use_Msal as its text', () => {
    win.ssconfig = { Teams_Use_Msal: true };
    expect(ssConfig('Teams_Use_Msal')).toBe('true');

    win.ssconfig = { Teams_Use_Msal: false };
    expect(ssConfig('Teams_Use_Msal')).toBe('false');
  });
});

describe('missingSsConfigKeys', () => {
  afterEach(() => {
    delete win.ssconfig;
  });

  it('lists every required key when ss-config.js sets none', () => {
    expect(missingSsConfigKeys()).toEqual([
      'Client_Id',
      'Client_Scopes',
      'Chat_Api_Uri',
      'Client_Authority or Tenant_Id',
    ]);
  });

  it('lists only the unset keys', () => {
    win.ssconfig = {
      Client_Id: 'client-1',
      Client_Authority: 'https://login.microsoftonline.com/tenant-1',
      Client_Scopes: '',
    };

    expect(missingSsConfigKeys()).toEqual(['Client_Scopes', 'Chat_Api_Uri']);
  });

  it('accepts either Client_Authority or Tenant_Id on its own', () => {
    win.ssconfig = {
      Client_Id: 'client-1',
      Client_Scopes: 'api://scope',
      Chat_Api_Uri: 'https://api',
      Tenant_Id: 'tenant-1',
    };
    expect(missingSsConfigKeys()).toEqual([]);

    win.ssconfig = {
      Client_Id: 'client-1',
      Client_Scopes: 'api://scope',
      Chat_Api_Uri: 'https://api',
      Client_Authority: 'https://login.microsoftonline.com/tenant-1',
    };
    expect(missingSsConfigKeys()).toEqual([]);
  });
});
