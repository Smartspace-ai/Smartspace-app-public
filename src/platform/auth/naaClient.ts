import { createNestablePublicClientApplication, InteractionRequiredAuthError, type Configuration, type IPublicClientApplication } from '@azure/msal-browser'
import { app as teamsApp } from '@microsoft/teams-js'

import { ssInfo, ssWarn } from '@/platform/log'

let pcaPromise: Promise<IPublicClientApplication> | null = null

export const naaInit = () => {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      try { 
        await teamsApp.initialize() 
        ssInfo('auth:naa', 'Teams SDK initialized for NAA');
      } catch (error) {
        ssWarn('auth:naa', 'Teams SDK initialization failed for NAA (continuing)', error);
        // Continue anyway, might work with existing initialization
      }
      const clientId = import.meta.env.VITE_CLIENT_ID as string
      const tenantId = import.meta.env.VITE_TENANT_ID as string
      const authority = `https://login.microsoftonline.com/${tenantId}`
      const config: Configuration = {
        auth: {
          clientId,
          authority,
          navigateToLoginRequestUrl: false,
          supportsNestedAppAuth: true,
        },
        system: { allowNativeBroker: false },
        cache: { cacheLocation: 'localStorage' },
      }
      return createNestablePublicClientApplication(config)
    })()
  }
  return pcaPromise
}

const tokenCache: Record<string, { token: string; exp: number }> = {}
const isExpired = (exp: number, skew = 60) => Math.floor(Date.now() / 1000) + skew >= exp

export type AcquireNaaTokenOptions = { silentOnly?: boolean };

export const acquireNaaToken = async (scopes: string[], opts?: AcquireNaaTokenOptions): Promise<string> => {
  ssInfo('auth:naa', 'acquireNaaToken start', { scopesCount: scopes.length, silentOnly: !!opts?.silentOnly })
  const key = scopes.sort().join(' ')
  const cached = tokenCache[key]
  if (cached && !isExpired(cached.exp)) return cached.token

  const pca = await naaInit()
  const accounts = pca.getAllAccounts()
  const account = accounts[0]
  
  try {
    if (!account) {
      ssWarn('auth:naa', 'No account found for NAA token acquisition');
      throw new InteractionRequiredAuthError('No account available')
    }
    
    ssInfo('auth:naa', 'Attempting silent token acquisition');
    const res = await pca.acquireTokenSilent({ account, scopes })
    const token = res.accessToken
    const exp = JSON.parse(atob(token.split('.')[1])).exp as number | undefined
    tokenCache[key] = { token, exp: exp ?? Math.floor(Date.now() / 1000) + 900 }
    ssInfo('auth:naa', 'Silent token acquisition successful');
    return token
  } catch (error) {
    if (opts?.silentOnly) throw error
    ssWarn('auth:naa', 'Silent token acquisition failed, trying popup', error);
    try {
      const res = await pca.acquireTokenPopup({ scopes })
      const token = res.accessToken
      const exp = JSON.parse(atob(token.split('.')[1])).exp as number | undefined
      tokenCache[key] = { token, exp: exp ?? Math.floor(Date.now() / 1000) + 900 }
      ssInfo('auth:naa', 'Popup token acquisition successful');
      return token
    } catch (popupError) {
      ssWarn('auth:naa', 'Both silent and popup token acquisition failed', popupError);
      throw popupError;
    }
  }
}
